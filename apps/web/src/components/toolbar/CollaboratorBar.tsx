'use client'

import { useCollaboration } from '@flowbase/canvas'
import { usePresence } from '@flowbase/canvas'
import type { RemoteUser } from '@flowbase/canvas'

interface CollaboratorBarProps {
  onPanToUser?: (x: number, y: number) => void
}

export default function CollaboratorBar({ onPanToUser }: CollaboratorBarProps) {
  const { awareness, isCollaborating, status } = useCollaboration()
  const { remoteUsers } = usePresence(awareness)

  if (!isCollaborating) return null

  const maxVisible = 4
  const visibleUsers = remoteUsers.slice(0, maxVisible)
  const extraCount = remoteUsers.length - maxVisible

  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm border border-black/[0.06]">
      {/* Connection status dot */}
      <div
        className={`h-2 w-2 rounded-full mr-1 ${
          status === 'connected'
            ? 'bg-emerald-500'
            : status === 'connecting'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-red-400'
        }`}
        title={status}
      />

      {/* User pills */}
      {visibleUsers.map((user) => (
        <button
          key={user.clientId}
          className="flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-black/5"
          title={`${user.name}${user.cursor ? ' — click to pan' : ''}`}
          onClick={() => {
            if (user.cursor && onPanToUser) {
              onPanToUser(user.cursor.x, user.cursor.y)
            }
          }}
        >
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: user.color }}
          />
          <span className="max-w-[80px] truncate">{user.name}</span>
        </button>
      ))}

      {/* Overflow count */}
      {extraCount > 0 && (
        <span className="text-xs text-neutral-400 pl-1">
          +{extraCount}
        </span>
      )}

      {/* Empty state */}
      {remoteUsers.length === 0 && (
        <span className="text-xs text-neutral-400">No one else here</span>
      )}
    </div>
  )
}
