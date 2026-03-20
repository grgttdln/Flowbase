import { Rect } from 'react-konva';
import type { Element } from '@flowbase/shared';

interface RectShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const RectShape = ({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd }: RectShapeProps) => {
  return (
    <Rect
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      fill={element.fill}
      stroke={isSelected ? '#007AFF' : element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      draggable={!element.locked}
      cornerRadius={4}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    />
  );
};

export default RectShape;
