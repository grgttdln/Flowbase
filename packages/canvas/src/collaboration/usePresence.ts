import { useCallback, useEffect, useRef, useState } from 'react'
import type { Awareness } from 'y-protocols/awareness'
import { useCanvasStore } from '../store/useCanvasStore'
import { CURSOR_THROTTLE_MS, PRESENCE_COLORS, getPresenceColor, getPresenceName } from './constants'

export interface RemoteUser {
  clientId: number
  name: string
  color: string
  cursor: { x: number; y: number } | null
  selection: string[]
}

export interface PresenceState {
  user: {
    name: string
    color: string
  }
  cursor: { x: number; y: number } | null
  selection: string[]
}

export function usePresence(awareness: Awareness | null) {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const lastCursorUpdate = useRef(0)
  const localStateRef = useRef<PresenceState | null>(null)

  // Initialize local awareness state
  useEffect(() => {
    if (!awareness) return

    const existingStates = Array.from(awareness.getStates().values())
    const usedColors = new Set(
      existingStates
        .filter((s) => s.user?.color)
        .map((s) => s.user.color as string),
    )

    let colorIndex = 0
    for (let i = 0; i < PRESENCE_COLORS.length; i++) {
      if (!usedColors.has(PRESENCE_COLORS[i])) {
        colorIndex = i
        break
      }
    }

    const color = getPresenceColor(colorIndex)
    const name = getPresenceName(colorIndex)

    const localState: PresenceState = {
      user: { name, color },
      cursor: null,
      selection: [],
    }
    localStateRef.current = localState
    awareness.setLocalState(localState)

    return () => {
      awareness.setLocalState(null)
    }
  }, [awareness])

  // Sync selection from Zustand to awareness
  useEffect(() => {
    if (!awareness || !localStateRef.current) return

    const unsubscribe = useCanvasStore.subscribe((state) => {
      const selection = Array.from(state.selectedIds)
      if (!localStateRef.current) return

      const prev = localStateRef.current.selection
      if (
        selection.length === prev.length &&
        selection.every((id, i) => id === prev[i])
      ) {
        return
      }

      localStateRef.current = {
        ...localStateRef.current,
        selection,
      }
      awareness.setLocalState(localStateRef.current)
    })

    return unsubscribe
  }, [awareness])

  // Listen to remote awareness changes
  useEffect(() => {
    if (!awareness) return

    const updateRemoteUsers = () => {
      const states = awareness.getStates()
      const localClientId = awareness.clientID
      const users: RemoteUser[] = []

      states.forEach((state, clientId) => {
        if (clientId === localClientId) return
        if (!state.user) return

        users.push({
          clientId,
          name: state.user.name || 'Anonymous',
          color: state.user.color || '#888888',
          cursor: state.cursor || null,
          selection: state.selection || [],
        })
      })

      setRemoteUsers(users)
    }

    awareness.on('change', updateRemoteUsers)
    updateRemoteUsers()

    return () => {
      awareness.off('change', updateRemoteUsers)
    }
  }, [awareness])

  // Throttled cursor update
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!awareness || !localStateRef.current) return

      const now = Date.now()
      if (now - lastCursorUpdate.current < CURSOR_THROTTLE_MS) return
      lastCursorUpdate.current = now

      localStateRef.current = {
        ...localStateRef.current,
        cursor: { x, y },
      }
      awareness.setLocalState(localStateRef.current)
    },
    [awareness],
  )

  const clearCursor = useCallback(() => {
    if (!awareness || !localStateRef.current) return

    localStateRef.current = {
      ...localStateRef.current,
      cursor: null,
    }
    awareness.setLocalState(localStateRef.current)
  }, [awareness])

  return { remoteUsers, updateCursor, clearCursor }
}
