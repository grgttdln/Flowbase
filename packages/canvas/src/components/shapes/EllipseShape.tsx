import { Ellipse } from 'react-konva';
import type { Element } from '@flowbase/shared';

interface EllipseShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
}

const EllipseShape = ({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd }: EllipseShapeProps) => {
  return (
    <Ellipse
      id={element.id}
      x={element.x + element.width / 2}
      y={element.y + element.height / 2}
      radiusX={element.width / 2}
      radiusY={element.height / 2}
      rotation={element.rotation}
      fill={element.fill}
      stroke={isSelected ? '#007AFF' : element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => {
        const x = e.target.x() - element.width / 2;
        const y = e.target.y() - element.height / 2;
        onDragMove(element.id, x, y);
      }}
      onDragEnd={() => onDragEnd(element.id)}
    />
  );
};

export default EllipseShape;
