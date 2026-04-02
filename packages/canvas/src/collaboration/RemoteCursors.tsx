import React, { memo } from 'react'
import { Group, Path, Label, Tag, Text } from 'react-konva'
import type { RemoteUser } from './usePresence'

const CURSOR_PATH = 'M0 0 L16 10.5 L8.5 10.5 L8.5 18 L0 18 Z'

interface RemoteCursorProps {
  user: RemoteUser
}

const RemoteCursor = memo(({ user }: RemoteCursorProps) => {
  if (!user.cursor) return null

  return (
    <Group x={user.cursor.x} y={user.cursor.y}>
      <Path
        data={CURSOR_PATH}
        fill={user.color}
        stroke="#ffffff"
        strokeWidth={1}
        scaleX={0.85}
        scaleY={0.85}
      />
      <Label x={12} y={16}>
        <Tag
          fill={user.color}
          cornerRadius={3}
          pointerDirection="none"
        />
        <Text
          text={user.name}
          fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#ffffff"
          padding={3}
        />
      </Label>
    </Group>
  )
})

RemoteCursor.displayName = 'RemoteCursor'

interface RemoteCursorsProps {
  remoteUsers: RemoteUser[]
  viewport?: { x: number; y: number; zoom: number; width: number; height: number }
}

const RemoteCursors = memo(({ remoteUsers, viewport }: RemoteCursorsProps) => {
  const usersWithCursors = remoteUsers.filter((u) => {
    if (!u.cursor) return false
    if (!viewport) return true
    // Check if cursor is within the visible canvas area
    const viewLeft = -viewport.x / viewport.zoom
    const viewTop = -viewport.y / viewport.zoom
    const viewRight = viewLeft + viewport.width / viewport.zoom
    const viewBottom = viewTop + viewport.height / viewport.zoom
    // Add generous padding (200px in canvas space) so cursors near edges don't pop in/out
    const pad = 200
    return (
      u.cursor.x >= viewLeft - pad &&
      u.cursor.x <= viewRight + pad &&
      u.cursor.y >= viewTop - pad &&
      u.cursor.y <= viewBottom + pad
    )
  })

  if (usersWithCursors.length === 0) return null

  return (
    <>
      {usersWithCursors.map((user) => (
        <RemoteCursor key={user.clientId} user={user} />
      ))}
    </>
  )
})

RemoteCursors.displayName = 'RemoteCursors'

export default RemoteCursors
