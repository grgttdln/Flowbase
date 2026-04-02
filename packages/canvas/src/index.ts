// Components
export { default as FlowbaseCanvas } from './components/FlowbaseCanvas';
export type { LayoutPreviewPosition } from './components/FlowbaseCanvas';

// Store
export { useCanvasStore } from './store/useCanvasStore';
export type { CanvasState } from './store/useCanvasStore';
export { useStyleDefaults, getToolCategory } from './store/useStyleDefaults';
export type { CategoryDefaults, ToolCategory } from './store/useStyleDefaults';

// Tools
export { useToolHandlers } from './tools/useToolHandlers';

// Utils
export { snapPosition, snapToGrid } from './utils/snapping';
export type { SnapResult, SnapGuide } from './utils/snapping';
export { getElementBounds, getSelectionBounds, isPointInBounds, doBoundsOverlap } from './utils/geometry';
export type { BoundingBox } from './utils/geometry';
export { getAnchorPoints, getAnchorPosition, findNearestAnchor, recalcBoundArrow } from './utils/connectors';
export type { AnchorPoint } from './utils/connectors';

// Collaboration
export {
  CollaborationProvider,
  useCollaboration,
  type CollabState,
  type CollabContextValue,
  type ConnectionStatus,
} from './collaboration';
