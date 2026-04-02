import { useEffect, useState } from 'react'
import type { Awareness } from 'y-protocols/awareness'
import type { RemoteUser } from './usePresence'

/**
 * Read-only hook that listens to remote awareness states.
 * Unlike usePresence, this does NOT initialize local state,
 * subscribe to Zustand selections, or provide cursor callbacks.
 * Use this when you only need the remote users list (e.g., CollaboratorBar).
 */
export function useRemoteUsers(awareness: Awareness | null): RemoteUser[] {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])

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

  return remoteUsers
}
