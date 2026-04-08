'use client';

import { useState, useCallback, useRef } from 'react';
import { Circle, Arrow, Group } from 'react-konva';
import type Konva from 'konva';
import type { Element, AnchorPosition } from '@flowbase/shared';
import { DEFAULT_ELEMENT_PROPS, generateId } from '@flowbase/shared';
import { useCanvasStore } from '../store/useCanvasStore';
import {
  getAnchorPoints,
  getAnchorPosition,
  findNearestAnchor,
  recalcBoundArrow,
  CONNECTABLE_TYPES,
} from '../utils/connectors';
import type { AnchorPoint } from '../utils/connectors';

const HANDLE_RADIUS = 5;
const HANDLE_HOVER_RADIUS = 7;
const HANDLE_OFFSET = 14;
const DETECT_RADIUS = 200;
const SHAPE_GAP = 160;
const MIN_DRAG_DISTANCE = 10;

/** Opposite anchor for auto-positioning new shapes */
const OPPOSITE_ANCHOR: Record<AnchorPosition, AnchorPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Direction offsets for positioning handles outside the shape */
const ANCHOR_OFFSET: Record<AnchorPosition, { dx: number; dy: number }> = {
  top: { dx: 0, dy: -HANDLE_OFFSET },
  bottom: { dx: 0, dy: HANDLE_OFFSET },
  left: { dx: -HANDLE_OFFSET, dy: 0 },
  right: { dx: HANDLE_OFFSET, dy: 0 },
};

interface DragState {
  sourceElementId: string;
  sourceAnchor: AnchorPosition;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  snappedTarget: AnchorPoint | null;
}

interface ConnectionHandlesProps {
  elements: Element[];
  selectedIds: Set<string>;
}

/** Create a new shape cloned from source, positioned based on anchor direction */
function buildCloneAndArrow(
  sourceEl: Element,
  anchor: AnchorPosition,
  currentElements: Element[],
  maxZ: number,
): { newShape: Element; arrow: Element } {
  const oppositeAnchor = OPPOSITE_ANCHOR[anchor];

  let newX = sourceEl.x;
  let newY = sourceEl.y;
  switch (anchor) {
    case 'right':
      newX = sourceEl.x + sourceEl.width + SHAPE_GAP;
      newY = sourceEl.y;
      break;
    case 'left':
      newX = sourceEl.x - SHAPE_GAP - sourceEl.width;
      newY = sourceEl.y;
      break;
    case 'bottom':
      newX = sourceEl.x;
      newY = sourceEl.y + sourceEl.height + SHAPE_GAP;
      break;
    case 'top':
      newX = sourceEl.x;
      newY = sourceEl.y - SHAPE_GAP - sourceEl.height;
      break;
  }

  const newShape: Element = {
    ...DEFAULT_ELEMENT_PROPS,
    id: generateId(),
    type: sourceEl.type,
    x: newX,
    y: newY,
    width: sourceEl.width,
    height: sourceEl.height,
    fill: sourceEl.fill,
    stroke: sourceEl.stroke,
    strokeWidth: sourceEl.strokeWidth,
    opacity: sourceEl.opacity,
    rotation: 0,
    locked: false,
    zIndex: maxZ + 1,
  };

  const startPos = getAnchorPosition(sourceEl, anchor);
  const endPos = getAnchorPosition(newShape, oppositeAnchor);

  const arrowEl: Element = {
    ...DEFAULT_ELEMENT_PROPS,
    id: generateId(),
    type: 'arrow',
    x: startPos.x,
    y: startPos.y,
    width: Math.abs(endPos.x - startPos.x),
    height: Math.abs(endPos.y - startPos.y),
    points: [0, 0, endPos.x - startPos.x, endPos.y - startPos.y],
    startBinding: { elementId: sourceEl.id, anchor },
    endBinding: { elementId: newShape.id, anchor: oppositeAnchor },
    autoRoute: true,
    fill: 'transparent',
    stroke: sourceEl.stroke,
    strokeWidth: sourceEl.strokeWidth,
    zIndex: maxZ + 2,
  };

  const allElements = [...currentElements, newShape, arrowEl];
  const routeUpdate = recalcBoundArrow(arrowEl, allElements);
  const finalArrow = routeUpdate ? { ...arrowEl, ...routeUpdate } : arrowEl;

  return { newShape, arrow: finalArrow };
}

/** Create an arrow connecting source to an existing target anchor */
function buildConnectionArrow(
  sourceEl: Element,
  anchor: AnchorPosition,
  targetAnchor: AnchorPoint,
  currentElements: Element[],
  maxZ: number,
): Element {
  const startPos = getAnchorPosition(sourceEl, anchor);
  const endPos = { x: targetAnchor.x, y: targetAnchor.y };

  const arrowEl: Element = {
    ...DEFAULT_ELEMENT_PROPS,
    id: generateId(),
    type: 'arrow',
    x: startPos.x,
    y: startPos.y,
    width: Math.abs(endPos.x - startPos.x),
    height: Math.abs(endPos.y - startPos.y),
    points: [0, 0, endPos.x - startPos.x, endPos.y - startPos.y],
    startBinding: { elementId: sourceEl.id, anchor },
    endBinding: {
      elementId: targetAnchor.elementId,
      anchor: targetAnchor.anchor,
    },
    autoRoute: true,
    fill: 'transparent',
    stroke: sourceEl.stroke,
    strokeWidth: sourceEl.strokeWidth,
    zIndex: maxZ + 1,
  };

  const allElements = [...currentElements, arrowEl];
  const routeUpdate = recalcBoundArrow(arrowEl, allElements);
  return routeUpdate ? { ...arrowEl, ...routeUpdate } : arrowEl;
}

const ConnectionHandles = ({ elements, selectedIds }: ConnectionHandlesProps) => {
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const selectIds = useCanvasStore((s) => s.select);
  const setElements = useCanvasStore((s) => s.setElements);

  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // Track whether a drag actually moved (to distinguish click from drag)
  const didDrag = useRef(false);

  const selectedConnectable = elements.filter(
    (el) => selectedIds.has(el.id) && CONNECTABLE_TYPES.has(el.type),
  );

  // Find the nearest target for a given handle (used for hover suggestion)
  const findTarget = useCallback(
    (elementId: string, anchor: AnchorPosition): AnchorPoint | null => {
      const el = elementsRef.current.find((item) => item.id === elementId);
      if (!el) return null;
      const pos = getAnchorPosition(el, anchor);
      return findNearestAnchor(pos.x, pos.y, elementsRef.current, elementId, DETECT_RADIUS);
    },
    [],
  );

  // Click handler — creates clone (no nearby) or connects (nearby)
  const handleClick = useCallback(
    (elementId: string, anchor: AnchorPosition) => {
      // Skip if a drag just happened
      if (didDrag.current) return;

      const currentElements = elementsRef.current;
      const sourceEl = currentElements.find((el) => el.id === elementId);
      if (!sourceEl) return;

      pushHistory();
      const maxZ = currentElements.length > 0
        ? Math.max(...currentElements.map((el) => el.zIndex))
        : -1;

      const nearby = findTarget(elementId, anchor);

      if (nearby) {
        // Connect to nearby shape
        const arrow = buildConnectionArrow(sourceEl, anchor, nearby, currentElements, maxZ);
        setElements([...currentElements, arrow]);
        selectIds([elementId]);
      } else {
        // Create clone + connect
        const { newShape, arrow } = buildCloneAndArrow(sourceEl, anchor, currentElements, maxZ);
        setElements([...currentElements, newShape, arrow]);
        selectIds([newShape.id, arrow.id]);
      }
    },
    [pushHistory, selectIds, setElements, findTarget],
  );

  // Drag handlers — for drawing arrow to a specific target
  const handleDragStart = useCallback(
    (elementId: string, anchor: AnchorPosition, e: Konva.KonvaEventObject<DragEvent>) => {
      didDrag.current = false;
      const el = elementsRef.current.find((item) => item.id === elementId);
      if (!el) return;
      const pos = getAnchorPosition(el, anchor);
      const offset = ANCHOR_OFFSET[anchor];
      e.target.x(pos.x + offset.dx);
      e.target.y(pos.y + offset.dy);
      setDragState({
        sourceElementId: elementId,
        sourceAnchor: anchor,
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
        snappedTarget: null,
      });
    },
    [],
  );

  const handleDragMove = useCallback(
    (elementId: string, _anchor: AnchorPosition, e: Konva.KonvaEventObject<DragEvent>) => {
      didDrag.current = true;
      const x = e.target.x();
      const y = e.target.y();

      const snapped = findNearestAnchor(
        x,
        y,
        elementsRef.current,
        elementId,
        DETECT_RADIUS,
      );

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: snapped ? snapped.x : x,
              currentY: snapped ? snapped.y : y,
              snappedTarget: snapped,
            }
          : null,
      );
    },
    [],
  );

  const handleDragEnd = useCallback(
    (elementId: string, anchor: AnchorPosition, e: Konva.KonvaEventObject<DragEvent>) => {
      const state = dragState;
      if (!state) {
        setDragState(null);
        return;
      }

      const currentElements = elementsRef.current;
      const sourceEl = currentElements.find((el) => el.id === elementId);
      if (!sourceEl) {
        setDragState(null);
        return;
      }

      // Reset the handle circle back to offset anchor position
      const anchorPos = getAnchorPosition(sourceEl, anchor);
      const offset = ANCHOR_OFFSET[anchor];
      e.target.x(anchorPos.x + offset.dx);
      e.target.y(anchorPos.y + offset.dy);

      // Check if drag was long enough to count
      const dist = Math.hypot(
        state.currentX - state.startX,
        state.currentY - state.startY,
      );
      if (dist < MIN_DRAG_DISTANCE) {
        setDragState(null);
        return;
      }

      pushHistory();

      const maxZ = currentElements.length > 0
        ? Math.max(...currentElements.map((el) => el.zIndex))
        : -1;

      if (state.snappedTarget) {
        // Dragged to a specific target — connect
        const arrow = buildConnectionArrow(sourceEl, anchor, state.snappedTarget, currentElements, maxZ);
        setElements([...currentElements, arrow]);
        selectIds([elementId]);
      } else {
        // Dragged but no target — create clone at the handle direction
        const { newShape, arrow } = buildCloneAndArrow(sourceEl, anchor, currentElements, maxZ);
        setElements([...currentElements, newShape, arrow]);
        selectIds([newShape.id, arrow.id]);
      }

      setDragState(null);
    },
    [dragState, pushHistory, selectIds, setElements],
  );

  // Build the preview arrow for rendering during drag
  let previewArrow: { points: number[] } | null = null;
  if (dragState) {
    const dist = Math.hypot(
      dragState.currentX - dragState.startX,
      dragState.currentY - dragState.startY,
    );
    if (dist >= MIN_DRAG_DISTANCE) {
      previewArrow = {
        points: [
          dragState.startX,
          dragState.startY,
          dragState.currentX,
          dragState.currentY,
        ],
      };
    }
  }

  // Build hover suggestion line (when hovering a handle near another shape)
  let suggestionLine: { points: number[]; targetAnchor: AnchorPoint } | null = null;
  if (hoveredHandle && !dragState) {
    const [elId, anchorName] = hoveredHandle.split('-');
    const nearby = findTarget(elId, anchorName as AnchorPosition);
    if (nearby) {
      const sourceEl = elements.find((el) => el.id === elId);
      if (sourceEl) {
        const startPos = getAnchorPosition(sourceEl, anchorName as AnchorPosition);
        suggestionLine = {
          points: [startPos.x, startPos.y, nearby.x, nearby.y],
          targetAnchor: nearby,
        };
      }
    }
  }

  return (
    <Group>
      {/* Preview arrow while dragging */}
      {previewArrow && (
        <Arrow
          points={previewArrow.points}
          stroke="#007AFF"
          strokeWidth={2}
          fill="#007AFF"
          pointerLength={8}
          pointerWidth={6}
          dash={[6, 4]}
          listening={false}
        />
      )}

      {/* Hover suggestion line to nearby shape */}
      {suggestionLine && (
        <>
          <Arrow
            points={suggestionLine.points}
            stroke="#007AFF"
            strokeWidth={1.5}
            fill="#007AFF"
            pointerLength={6}
            pointerWidth={5}
            dash={[4, 3]}
            opacity={0.5}
            listening={false}
          />
          <Circle
            x={suggestionLine.targetAnchor.x}
            y={suggestionLine.targetAnchor.y}
            radius={6}
            fill="rgba(0, 122, 255, 0.15)"
            stroke="#007AFF"
            strokeWidth={1.5}
            listening={false}
          />
        </>
      )}

      {/* Snapped target highlight during drag */}
      {dragState?.snappedTarget && (
        <Circle
          x={dragState.snappedTarget.x}
          y={dragState.snappedTarget.y}
          radius={8}
          fill="rgba(0, 122, 255, 0.2)"
          stroke="#007AFF"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Handle circles for each selected connectable shape */}
      {selectedConnectable.map((el) =>
        getAnchorPoints(el).map((anchorPt) => {
          const handleKey = `${el.id}-${anchorPt.anchor}`;
          const offset = ANCHOR_OFFSET[anchorPt.anchor];
          const handleX = anchorPt.x + offset.dx;
          const handleY = anchorPt.y + offset.dy;
          const isHovered = hoveredHandle === handleKey;
          const isDragging =
            dragState?.sourceElementId === el.id &&
            dragState?.sourceAnchor === anchorPt.anchor;

          return (
            <Circle
              key={handleKey}
              x={handleX}
              y={handleY}
              radius={isHovered || isDragging ? HANDLE_HOVER_RADIUS : HANDLE_RADIUS}
              fill={isHovered || isDragging ? '#007AFF' : 'white'}
              stroke="#007AFF"
              strokeWidth={2}
              draggable
              onClick={() => handleClick(el.id, anchorPt.anchor)}
              onTap={() => handleClick(el.id, anchorPt.anchor)}
              onMouseEnter={(e) => {
                setHoveredHandle(handleKey);
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'crosshair';
                }
              }}
              onMouseLeave={(e) => {
                setHoveredHandle(null);
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = '';
                }
              }}
              onDragStart={(e) =>
                handleDragStart(el.id, anchorPt.anchor, e)
              }
              onDragMove={(e) =>
                handleDragMove(el.id, anchorPt.anchor, e)
              }
              onDragEnd={(e) =>
                handleDragEnd(el.id, anchorPt.anchor, e)
              }
            />
          );
        }),
      )}
    </Group>
  );
};

export default ConnectionHandles;
