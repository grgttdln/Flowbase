import { Arrow } from 'react-konva';
import type { Element } from '@flowbase/shared';

interface ArrowShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const ArrowShape = ({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd }: ArrowShapeProps) => {
  return (
    <Arrow
      id={element.id}
      x={element.x}
      y={element.y}
      points={element.points ?? [0, 0, element.width, element.height]}
      rotation={element.rotation}
      stroke={isSelected ? '#007AFF' : element.stroke}
      strokeWidth={element.strokeWidth}
      fill={isSelected ? '#007AFF' : element.stroke}
      opacity={element.opacity}
      pointerLength={10}
      pointerWidth={10}
      draggable={!element.locked}
      hitStrokeWidth={10}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    />
  );
};

export default ArrowShape;
