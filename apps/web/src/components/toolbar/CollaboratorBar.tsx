'use client'

import { useCollaboration, useRemoteUsers } from '@flowbase/canvas'

interface CollaboratorBarProps {
  onPanToUser?: (x: number, y: number) => void
}

export default function CollaboratorBar({ onPanToUser }: CollaboratorBarProps) {
  const { awareness, isCollaborating, status } = useCollaboration()
  const remoteUsers = useRemoteUsers(awareness)

  if (!isCollaborating) return null

  const maxVisible = 4
  const visibleUsers = remoteUsers.slice(0, maxVisible)
  const extraCount = remoteUsers.length - maxVisible

  return (
    <div className="flex items-center gap-1 rounded-[14px] border border-black/[0.06] bg-white/90 px-2.5 py-1.5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl">
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
