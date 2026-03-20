import { DEFAULT_FILL, DEFAULT_STROKE } from './colors';

export const DEFAULT_ELEMENT_PROPS = {
  fill: DEFAULT_FILL,
  stroke: DEFAULT_STROKE,
  strokeWidth: 2,
  opacity: 1,
  rotation: 0,
  locked: false,
} as const;

export const DEFAULT_VIEWPORT = {
  zoom: 1,
  panX: 0,
  panY: 0,
} as const;

export const DEFAULT_FONT_SIZE = 16;
