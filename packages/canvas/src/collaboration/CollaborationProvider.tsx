import React, { createContext, useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
// @ts-expect-error y-websocket has no types
import { WebsocketProvider } from 'y-websocket'
import type { Awareness } from 'y-protocols/awareness'
import { useCanvasStore } from '../store/useCanvasStore'
import { initYDocFromStore, initStoreFromYDoc, startSync } from './yjsSync'
import type { CollabContextValue, ConnectionStatus } from './types'

const COLLAB_SERVER_URL = process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:4444'

export const CollabContext = createContext<CollabContextValue>({
  isCollaborating: false,
  roomId: null,
  status: 'disconnected',
  doc: null,
  awareness: null,
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

  const providerRef = useRef<WebsocketProvider | null>(null)
  const cleanupSyncRef = useRef<(() => void) | null>(null)
  const docRef = useRef<Y.Doc | null>(null)

  const startCollaboration = useCallback(
    (newRoomId: string, owner: boolean) => {
      // Clean up any existing session
      if (cleanupSyncRef.current) cleanupSyncRef.current()
      if (providerRef.current) providerRef.current.destroy()
      if (docRef.current) docRef.current.destroy()

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

  const value: CollabContextValue = {
    isCollaborating: status === 'connected',
    roomId,
    status,
    doc,
    awareness,
    startCollaboration,
    stopCollaboration,
  }

  return (
    <CollabContext.Provider value={value}>
      {children}
    </CollabContext.Provider>
  )
}
