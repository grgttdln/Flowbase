import { Line } from 'react-konva';
import type { Element } from '@flowbase/shared';
import React from 'react';

interface FreehandShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const FreehandShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd }: FreehandShapeProps) => {
  return (
    <Line
      id={element.id}
      x={element.x}
      y={element.y}
      points={element.points ?? []}
      rotation={element.rotation}
      stroke={isSelected ? '#007AFF' : element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      draggable={!element.locked}
      hitStrokeWidth={10}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    />
  );
});

FreehandShape.displayName = 'FreehandShape';

export default FreehandShape;
