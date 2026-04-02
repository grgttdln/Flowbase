import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
// @ts-ignore y-websocket has no types
import { WebsocketProvider } from 'y-websocket'
import type { Awareness } from 'y-protocols/awareness'
import { useCanvasStore } from '../store/useCanvasStore'
import { initYDocFromStore, initStoreFromYDoc, startSync } from './yjsSync'
import type { CollabContextValue, ConnectionStatus } from './types'

declare const process: { env: Record<string, string | undefined> }
const COLLAB_SERVER_URL = process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:4444'

export const CollabContext = createContext<CollabContextValue>({
  isCollaborating: false,
  roomId: null,
  status: 'disconnected',
  doc: null,
  awareness: null,
  sessionEnded: false,
  startCollaboration: () => {},
  stopCollaboration: () => {},
})

interface CollaborationProviderProps {
  children: React.ReactNode
  roomId?: string
  isOwner?: boolean
}

export function CollaborationProvider({
  children,
  roomId: initialRoomId,
  isOwner = false,
}: CollaborationProviderProps) {
  const [roomId, setRoomId] = useState<string | null>(initialRoomId ?? null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [awareness, setAwareness] = useState<Awareness | null>(null)
  const [sessionEnded, setSessionEnded] = useState(false)

  const providerRef = useRef<WebsocketProvider | null>(null)
  const cleanupSyncRef = useRef<(() => void) | null>(null)
  const docRef = useRef<Y.Doc | null>(null)

  const startCollaboration = useCallback(
    (newRoomId: string, owner: boolean) => {
      // Clean up any existing session
      if (cleanupSyncRef.current) cleanupSyncRef.current()
      if (providerRef.current) providerRef.current.destroy()
      if (docRef.current) docRef.current.destroy()

      setSessionEnded(false)

      const ydoc = new Y.Doc()
      docRef.current = ydoc
      setDoc(ydoc)
      setRoomId(newRoomId)
      setStatus('connecting')

      const store = useCanvasStore

      // If owner, populate Yjs from current canvas state before connecting
      if (owner) {
        initYDocFromStore(ydoc, store)
      }

      const wsProvider = new WebsocketProvider(
        COLLAB_SERVER_URL,
        `rooms/${newRoomId}`,
        ydoc,
      )
      providerRef.current = wsProvider
      setAwareness(wsProvider.awareness)

      wsProvider.on('status', ({ status: wsStatus }: { status: string }) => {
        if (wsStatus === 'connected') {
          setStatus('connected')
        } else if (wsStatus === 'disconnected') {
          setStatus('disconnected')
          // Check if room still exists after a brief delay (allows for reconnect)
          setTimeout(async () => {
            if (providerRef.current?.wsconnected) return
            try {
              const httpUrl = COLLAB_SERVER_URL.replace(/^ws(s?)/, 'http$1')
              const res = await fetch(`${httpUrl}/rooms/${newRoomId}`)
              if (!res.ok) {
                setSessionEnded(true)
              }
            } catch {
              // Network error — don't assume session ended
            }
          }, 2000)
        } else {
          setStatus('connecting')
        }
      })

      // Once synced, initialize store from Yjs (for collaborators) and start sync
      wsProvider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          if (!owner) {
            initStoreFromYDoc(ydoc, store)
          }
          cleanupSyncRef.current = startSync(ydoc, store)
        }
      })
    },
    [],
  )

  const stopCollaboration = useCallback(() => {
    if (cleanupSyncRef.current) {
      cleanupSyncRef.current()
      cleanupSyncRef.current = null
    }
    if (providerRef.current) {
      providerRef.current.destroy()
      providerRef.current = null
    }
    if (docRef.current) {
      docRef.current.destroy()
      docRef.current = null
    }
    setDoc(null)
    setAwareness(null)
    setRoomId(null)
    setStatus('disconnected')
  }, [])

  // Auto-start if roomId is provided via props
  useEffect(() => {
    if (initialRoomId) {
      startCollaboration(initialRoomId, isOwner)
    }
    return () => {
      stopCollaboration()
    }
  }, [initialRoomId, isOwner, startCollaboration, stopCollaboration])

  // Reconnect on tab focus (browsers throttle background tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && providerRef.current) {
        // If the provider exists but isn't connected, nudge it to reconnect
        if (!providerRef.current.wsconnected) {
          providerRef.current.connect()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const value: CollabContextValue = {
    isCollaborating: status === 'connected',
    roomId,
    status,
    doc,
    awareness,
    sessionEnded,
    startCollaboration,
    stopCollaboration,
  }

  return (
    <CollabContext.Provider value={value}>
      {children}
    </CollabContext.Provider>
  )
}
