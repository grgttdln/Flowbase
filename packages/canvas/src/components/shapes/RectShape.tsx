import { Group, Rect, Text } from 'react-konva';
import type { Element } from '@flowbase/shared';
import React from 'react';

interface RectShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onDblClick?: (id: string) => void;
}

const RectShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onDblClick }: RectShapeProps) => {
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
      onDblClick={() => onDblClick?.(element.id)}
      onDblTap={() => onDblClick?.(element.id)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={element.fill}
        stroke={isSelected ? '#007AFF' : element.stroke}
        strokeWidth={element.strokeWidth}
        cornerRadius={4}
      />
      {element.text && (
        <Text
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          text={element.text}
          fontSize={element.fontSize ?? 14}
          fill={element.stroke}
          align="center"
          verticalAlign="middle"
          listening={false}
          padding={4}
        />
      )}
    </Group>
  );
});

RectShape.displayName = 'RectShape';

export default RectShape;
