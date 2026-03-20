export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'text';

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  groupId?: string;
  zIndex: number;
  locked: boolean;
}
