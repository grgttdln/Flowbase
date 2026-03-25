import { Text } from 'react-konva';
import type { Element } from '@flowbase/shared';
import { DEFAULT_FONT_SIZE } from '@flowbase/shared';
import React from 'react';

interface TextShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onDblClick: (id: string) => void;
}

const TextShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onDblClick }: TextShapeProps) => {
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width || undefined}
      text={element.text ?? 'Text'}
      fontSize={element.fontSize ?? DEFAULT_FONT_SIZE}
      fill={element.stroke}
      opacity={element.opacity}
      rotation={element.rotation}
      draggable={!element.locked}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDblClick={() => onDblClick(element.id)}
      onDblTap={() => onDblClick(element.id)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    />
  );
});

TextShape.displayName = 'TextShape';

export default TextShape;
