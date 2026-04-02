import { useContext } from 'react'
import { CollabContext } from './CollaborationProvider'
import type { CollabContextValue } from './types'

export function useCollaboration(): CollabContextValue {
  return useContext(CollabContext)
}
