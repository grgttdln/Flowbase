import type { Awareness } from 'y-protocols/awareness'
import type * as Y from 'yjs'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface CollabState {
  isCollaborating: boolean
  roomId: string | null
  status: ConnectionStatus
  doc: Y.Doc | null
  awareness: Awareness | null
  sessionEnded: boolean
}

export interface CollabContextValue extends CollabState {
  startCollaboration: (roomId: string, isOwner: boolean) => void
  stopCollaboration: () => void
}
