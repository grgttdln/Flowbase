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

const ConnectionHandles = ({ elements, selectedIds }: ConnectionHandlesProps) => {
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const selectIds = useCanvasStore((s) => s.select);
  const setElements = useCanvasStore((s) => s.setElements);

  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const selectedConnectable = elements.filter(
    (el) => selectedIds.has(el.id) && CONNECTABLE_TYPES.has(el.type),
  );

  const handleDragStart = useCallback(
    (elementId: string, anchor: AnchorPosition, e: Konva.KonvaEventObject<DragEvent>) => {
      const el = elementsRef.current.find((item) => item.id === elementId);
      if (!el) return;
      const pos = getAnchorPosition(el, anchor);
      e.target.x(pos.x);
      e.target.y(pos.y);
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

      // Reset the handle circle back to anchor position
      const anchorPos = getAnchorPosition(sourceEl, anchor);
      e.target.x(anchorPos.x);
      e.target.y(anchorPos.y);

      // Check if drag was long enough to count
      const dist = Math.hypot(
        state.currentX - state.startX,
        state.currentY - state.startY,
      );
      if (dist < MIN_DRAG_DISTANCE) {
        setDragState(null);
        return;
      }

      // Push history once for the entire operation (undo in one step)
      pushHistory();

      const maxZ = currentElements.length > 0
        ? Math.max(...currentElements.map((el) => el.zIndex))
        : -1;

      if (state.snappedTarget) {
        // Case A: snapped to a nearby shape — connect to it
        const targetAnchor = state.snappedTarget;
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

        // Recalc auto-route using locally constructed element
        const allElements = [...currentElements, arrowEl];
        const routeUpdate = recalcBoundArrow(arrowEl, allElements);
        const finalArrow = routeUpdate ? { ...arrowEl, ...routeUpdate } : arrowEl;

        setElements([...currentElements, finalArrow]);
        selectIds([elementId]);
      } else {
        // Case B: no nearby shape — create a clone and connect
        const oppositeAnchor = OPPOSITE_ANCHOR[anchor];

        // Position the new shape based on the handle direction
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

        const newShapeEl: Element = {
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
        const endPos = getAnchorPosition(newShapeEl, oppositeAnchor);

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
          endBinding: { elementId: newShapeEl.id, anchor: oppositeAnchor },
          autoRoute: true,
          fill: 'transparent',
          stroke: sourceEl.stroke,
          strokeWidth: sourceEl.strokeWidth,
          zIndex: maxZ + 2,
        };

        // Recalc auto-route
        const allElements = [...currentElements, newShapeEl, arrowEl];
        const routeUpdate = recalcBoundArrow(arrowEl, allElements);
        const finalArrow = routeUpdate ? { ...arrowEl, ...routeUpdate } : arrowEl;

        setElements([...currentElements, newShapeEl, finalArrow]);
        selectIds([newShapeEl.id, finalArrow.id]);
      }

      setDragState(null);
    },
    [dragState, pushHistory, selectIds, setElements],
  );

  // Build the preview arrow points for rendering during drag
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

      {/* Snapped target highlight */}
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
          const isHovered = hoveredHandle === handleKey;
          const isDragging =
            dragState?.sourceElementId === el.id &&
            dragState?.sourceAnchor === anchorPt.anchor;

          return (
            <Circle
              key={handleKey}
              x={anchorPt.x}
              y={anchorPt.y}
              radius={isHovered || isDragging ? HANDLE_HOVER_RADIUS : HANDLE_RADIUS}
              fill={isHovered || isDragging ? '#007AFF' : 'white'}
              stroke="#007AFF"
              strokeWidth={2}
              draggable
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
