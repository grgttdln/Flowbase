// Types
export type { Element, ElementType, Binding, AnchorPosition } from './types/element';
export type { SerializedScene } from './types/scene';
export type { Project } from './types/project';
export type { ToolType } from './types/tools';
export type { Viewport } from './types/viewport';
export type { AIRequest, AIActionType, ChatMessage } from './types/ai';

// Constants
export { UI_COLORS, SHAPE_COLORS, DEFAULT_STROKE, DEFAULT_FILL } from './constants/colors';
export { DEFAULT_ELEMENT_PROPS, DEFAULT_VIEWPORT, DEFAULT_FONT_SIZE } from './constants/defaults';
export { MAX_UNDO_STEPS, MAX_ZOOM, MIN_ZOOM, AUTO_SAVE_DEBOUNCE_MS } from './constants/limits';

// Validation
export { validateScene } from './validation/project';
export type { ValidationResult } from './validation/project';

// Utils
export { generateId } from './utils/id';

// App
export const APP_NAME = 'Flowbase';
