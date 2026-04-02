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
}

const RemoteCursors = memo(({ remoteUsers }: RemoteCursorsProps) => {
  const usersWithCursors = remoteUsers.filter((u) => u.cursor !== null)

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
