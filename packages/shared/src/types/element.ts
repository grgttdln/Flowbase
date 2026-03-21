export type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'text';

export type AnchorPosition = 'top' | 'bottom' | 'left' | 'right';

export interface Binding {
  elementId: string;
  anchor: AnchorPosition;
}

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
  startBinding?: Binding;
  endBinding?: Binding;
  autoRoute?: boolean;
  zIndex: number;
  locked: boolean;
}
