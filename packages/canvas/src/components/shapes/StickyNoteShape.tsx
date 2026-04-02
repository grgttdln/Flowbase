import { Group, Rect, Text } from 'react-konva';
import type { Element } from '@flowbase/shared';
import React from 'react';

interface StickyNoteShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onDblClick?: (id: string) => void;
}

const StickyNoteShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onDblClick }: StickyNoteShapeProps) => {
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
      {/* Shadow */}
      <Rect
        x={2}
        y={2}
        width={element.width}
        height={element.height}
        fill="rgba(0,0,0,0.08)"
        cornerRadius={3}
        listening={false}
      />
      {/* Note body */}
      <Rect
        width={element.width}
        height={element.height}
        fill={element.fill || '#fef08a'}
        stroke={isSelected ? '#7c3aed' : element.strokeWidth > 0 ? element.stroke : 'transparent'}
        strokeWidth={isSelected ? 2 : element.strokeWidth}
        cornerRadius={3}
      />
      {/* Fold corner */}
      <Rect
        x={element.width - 16}
        y={0}
        width={16}
        height={16}
        fill="rgba(0,0,0,0.06)"
        cornerRadius={[0, 3, 0, 0]}
        listening={false}
      />
      {element.text && (
        <Text
          x={12}
          y={12}
          width={element.width - 24}
          height={element.height - 24}
          text={element.text}
          fontSize={element.fontSize ?? 14}
          fill={element.stroke || '#713f12'}
          lineHeight={1.4}
          listening={false}
        />
      )}
    </Group>
  );
});

StickyNoteShape.displayName = 'StickyNoteShape';

export default StickyNoteShape;
