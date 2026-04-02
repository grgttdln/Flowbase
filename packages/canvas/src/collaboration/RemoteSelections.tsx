import React, { memo, useMemo } from 'react'
import { Group, Rect, Label, Tag, Text } from 'react-konva'
import type { Element } from '@flowbase/shared'
import type { RemoteUser } from './usePresence'

interface RemoteSelectionsProps {
  remoteUsers: RemoteUser[]
  elements: Element[]
}

const BORDER_WIDTH = 2
const BORDER_PADDING = 4

const RemoteSelections = memo(({ remoteUsers, elements }: RemoteSelectionsProps) => {
  const elementMap = useMemo(
    () => new Map(elements.map((el) => [el.id, el])),
    [elements],
  )

  const usersWithSelections = remoteUsers.filter((u) => u.selection.length > 0)

  if (usersWithSelections.length === 0) return null

  return (
    <>
      {usersWithSelections.map((user) => (
        <Group key={user.clientId}>
          {user.selection.map((elementId) => {
            const el = elementMap.get(elementId)
            if (!el) return null

            return (
              <Group key={elementId}>
                <Rect
                  x={el.x - BORDER_PADDING}
                  y={el.y - BORDER_PADDING}
                  width={el.width + BORDER_PADDING * 2}
                  height={el.height + BORDER_PADDING * 2}
                  stroke={user.color}
                  strokeWidth={BORDER_WIDTH}
                  cornerRadius={4}
                  dash={[6, 3]}
                  listening={false}
                />
                <Label x={el.x - BORDER_PADDING} y={el.y - BORDER_PADDING - 18}>
                  <Tag
                    fill={user.color}
                    cornerRadius={2}
                    pointerDirection="none"
                  />
                  <Text
                    text={user.name}
                    fontSize={10}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill="#ffffff"
                    padding={2}
                  />
                </Label>
              </Group>
            )
          })}
        </Group>
      ))}
    </>
  )
})

RemoteSelections.displayName = 'RemoteSelections'

export default RemoteSelections
