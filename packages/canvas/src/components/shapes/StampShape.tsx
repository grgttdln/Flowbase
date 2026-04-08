import { Group, Rect, Text } from 'react-konva';
import type { Element } from '@flowbase/shared';
import React from 'react';

interface StampShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const StampShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd }: StampShapeProps) => {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    >
      {/* Invisible hit area for selection and dragging */}
      <Rect
        width={element.width}
        height={element.height}
        fill="transparent"
      />
      <Text
        text={element.text ?? '⭐'}
        fontSize={element.fontSize ?? 64}
        width={element.width}
        height={element.height}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
});

StampShape.displayName = 'StampShape';

export default StampShape;
