import { Line } from 'react-konva';
import type { Element } from '@flowbase/shared';

interface DiamondShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const DiamondShape = ({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd }: DiamondShapeProps) => {
  const cx = element.width / 2;
  const cy = element.height / 2;
  const points = [cx, 0, element.width, cy, cx, element.height, 0, cy];

  return (
    <Line
      id={element.id}
      x={element.x}
      y={element.y}
      points={points}
      closed
      rotation={element.rotation}
      fill={element.fill}
      stroke={isSelected ? '#007AFF' : element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    />
  );
};

export default DiamondShape;
