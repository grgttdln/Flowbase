import { Group, Ellipse, Text } from 'react-konva';
import type { Element } from '@flowbase/shared';
import React from 'react';

interface EllipseShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onDblClick?: (id: string) => void;
}

const EllipseShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onDblClick }: EllipseShapeProps) => {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
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
      <Ellipse
        x={element.width / 2}
        y={element.height / 2}
        radiusX={element.width / 2}
        radiusY={element.height / 2}
        fill={element.fill}
        stroke={isSelected ? '#007AFF' : element.stroke}
        strokeWidth={element.strokeWidth}
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

EllipseShape.displayName = 'EllipseShape';

export default EllipseShape;
