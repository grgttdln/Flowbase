import type { Element } from '@flowbase/shared';

export interface ToolHandlers {
  onMouseDown: (x: number, y: number) => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseUp: (x: number, y: number) => void;
  getCursor: () => string;
}

export type CreateShapeData = Omit<Element, 'id' | 'zIndex'>;
