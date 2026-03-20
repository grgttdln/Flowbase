import type { Element } from '@flowbase/shared';
import RectShape from './RectShape';
import EllipseShape from './EllipseShape';
import DiamondShape from './DiamondShape';
import LineShape from './LineShape';
import ArrowShape from './ArrowShape';
import FreehandShape from './FreehandShape';
import TextShape from './TextShape';
import React from 'react';

interface ShapeRendererProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onTextDblClick: (id: string) => void;
}

const ShapeRenderer = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onTextDblClick }: ShapeRendererProps) => {
  const commonProps = { element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd };

  switch (element.type) {
    case 'rectangle':
      return <RectShape {...commonProps} />;
    case 'ellipse':
      return <EllipseShape {...commonProps} />;
    case 'diamond':
      return <DiamondShape {...commonProps} />;
    case 'line':
      return <LineShape {...commonProps} />;
    case 'arrow':
      return <ArrowShape {...commonProps} />;
    case 'freehand':
      return <FreehandShape {...commonProps} />;
    case 'text':
      return <TextShape {...commonProps} onDblClick={onTextDblClick} />;
    default:
      return null;
  }
});

ShapeRenderer.displayName = 'ShapeRenderer';

export default ShapeRenderer;
