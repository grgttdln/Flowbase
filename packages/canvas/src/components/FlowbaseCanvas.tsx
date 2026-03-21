'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import type { Element } from '@flowbase/shared';
import { useCanvasStore } from '../store/useCanvasStore';
import { useToolHandlers } from '../tools/useToolHandlers';
import { snapPosition, type SnapGuide } from '../utils/snapping';
import GridLayer from './GridLayer';
import ShapeRenderer from './shapes/ShapeRenderer';
import SelectionLayer from './SelectionLayer';
import SelectionBox from './SelectionBox';
import SnapGuides from './SnapGuides';
import ConnectionPoints from './ConnectionPoints';
import ArrowControls from './ArrowControls';
import { recalcBoundArrow, findNearestAnchor } from '../utils/connectors';

interface FlowbaseCanvasProps {
  width: number;
  height: number;
  stageRef?: React.RefObject<Konva.Stage | null>;
  onContextMenu?: (e: { x: number; y: number; elementId?: string }) => void;
}

const FlowbaseCanvas = ({ width, height, stageRef: externalStageRef, onContextMenu }: FlowbaseCanvasProps) => {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? internalStageRef;
  const {
    elements,
    selectedIds,
    activeTool,
    viewport,
    drawingElement,
    snapToGrid: snapGridEnabled,
    snapToElements: snapElementsEnabled,
    gridSize,
    select,
    toggleSelection,
    deselect,
    updateElement,
    deleteElements,
    copy,
    paste,
    undo,
    redo,
    group,
    ungroup,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    pushHistory,
    setViewport,
    zoomTo,
  } = useCanvasStore();

  const { onMouseDown, onMouseMove, onMouseUp, getCursor, getDrawingEndpoint, getSnappedAnchor } = useToolHandlers();

  // Space+drag panning
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number; lastPanX?: number; lastPanY?: number } | null>(null);

  // Snap guides
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);

  // Track if drag has started (for history push)
  const dragStarted = useRef(false);

  // Selection box (drag select)
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Arrow endpoint dragging state
  const [draggingEndpoint, setDraggingEndpoint] = useState<{
    elementId: string;
    pointIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const endpointAnchor = useRef<ReturnType<typeof findNearestAnchor>>(null);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 0) {
        e.preventDefault();
        deleteElements(Array.from(selectedIds));
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        }
        if (e.key === 'c') {
          e.preventDefault();
          copy();
        }
        if (e.key === 'v') {
          e.preventDefault();
          paste();
        }
        if (e.key === 'a') {
          e.preventDefault();
          select(elements.map((el) => el.id));
        }
        if (e.key === 'g' && e.shiftKey) {
          e.preventDefault();
          ungroup();
        } else if (e.key === 'g') {
          e.preventDefault();
          group();
        }
        if (e.key === ']') {
          e.preventDefault();
          if (e.shiftKey) bringToFront();
          else bringForward();
        }
        if (e.key === '[') {
          e.preventDefault();
          if (e.shiftKey) sendToBack();
          else sendBackward();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, deleteElements, copy, paste, select, elements, editingTextId, undo, redo, group, ungroup, bringForward, sendBackward, bringToFront, sendToBack]);

  // Get canvas coordinates from screen coordinates
  const getCanvasPos = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: (pos.x - viewport.panX) / viewport.zoom,
      y: (pos.y - viewport.panY) / viewport.zoom,
    };
  }, [viewport]);

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Space + drag = pan
    if (isSpaceDown) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        panStart.current = { x: pos.x, y: pos.y, panX: viewport.panX, panY: viewport.panY };
        setIsPanning(true);
      }
      return;
    }

    const clickedOnEmpty = e.target === e.target.getStage();

    if (activeTool === 'select') {
      if (clickedOnEmpty) {
        deselect();
        // Start selection box
        const pos = getCanvasPos(e);
        setSelectionBox({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y, width: 0, height: 0 });
      }
      return;
    }

    const pos = getCanvasPos(e);
    onMouseDown(pos.x, pos.y);
  }, [isSpaceDown, activeTool, viewport, deselect, getCanvasPos, onMouseDown]);

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Pan — manipulate Konva stage directly for smooth 60fps panning
    if (isPanning && panStart.current) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        const newPanX = panStart.current.panX + (pos.x - panStart.current.x);
        const newPanY = panStart.current.panY + (pos.y - panStart.current.y);
        const stage = stageRef.current;
        if (stage) {
          stage.x(newPanX);
          stage.y(newPanY);
          stage.batchDraw();
        }
        // Store for sync on mouse up
        panStart.current.lastPanX = newPanX;
        panStart.current.lastPanY = newPanY;
      }
      return;
    }

    // Selection box
    if (selectionBox && activeTool === 'select') {
      const pos = getCanvasPos(e);
      const x = Math.min(selectionBox.startX, pos.x);
      const y = Math.min(selectionBox.startY, pos.y);
      const w = Math.abs(pos.x - selectionBox.startX);
      const h = Math.abs(pos.y - selectionBox.startY);
      setSelectionBox({ ...selectionBox, x, y, width: w, height: h });

      // Select elements within box
      const ids = elements
        .filter((el) => {
          return el.x >= x && el.y >= y && el.x + el.width <= x + w && el.y + el.height <= y + h;
        })
        .map((el) => el.id);
      select(ids);
      return;
    }

    const pos = getCanvasPos(e);
    onMouseMove(pos.x, pos.y);
  }, [isPanning, selectionBox, activeTool, getCanvasPos, onMouseMove, setViewport, elements, select]);

  const handleStageMouseUp = useCallback(() => {
    if (isPanning) {
      // Sync final pan position to Zustand store
      if (panStart.current && panStart.current.lastPanX != null) {
        setViewport({
          panX: panStart.current.lastPanX,
          panY: panStart.current.lastPanY,
        });
      }
      setIsPanning(false);
      panStart.current = null;
      return;
    }

    if (selectionBox) {
      setSelectionBox(null);
      return;
    }

    setActiveGuides([]);
    dragStarted.current = false;
    onMouseUp();
  }, [isPanning, selectionBox, onMouseUp, setViewport]);

  // Wheel: trackpad two-finger pan + pinch zoom + mouse scroll zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const evt = e.evt;

    // Trackpad pinch (ctrlKey is set by browser for pinch gestures)
    if (evt.ctrlKey || evt.metaKey) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      // Use deltaY magnitude for proportional zoom — clamp to avoid huge jumps
      const delta = -evt.deltaY;
      const zoomFactor = Math.exp(Math.min(Math.max(delta, -2), 2) * 0.01);
      const newZoom = viewport.zoom * zoomFactor;
      zoomTo(newZoom, pointer);
      return;
    }

    // Two-finger pan on trackpad (deltaX + deltaY without ctrl)
    // Also handles mouse wheel if deltaX is ~0
    if (Math.abs(evt.deltaX) > 0 || !evt.ctrlKey) {
      // If there's meaningful horizontal delta, treat as trackpad pan
      if (Math.abs(evt.deltaX) > 1 || Math.abs(evt.deltaY) > 1) {
        // Heuristic: mouse wheel has deltaMode 0/1/2 and usually no deltaX
        const isTrackpadPan = Math.abs(evt.deltaX) > 0 || evt.deltaMode === 0;

        if (isTrackpadPan && Math.abs(evt.deltaX) > 0) {
          // Trackpad two-finger pan
          setViewport({
            panX: viewport.panX - evt.deltaX,
            panY: viewport.panY - evt.deltaY,
          });
          return;
        }

        // Regular mouse scroll wheel — zoom
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const direction = evt.deltaY > 0 ? -1 : 1;
        const zoomFactor = Math.exp(direction * 0.03);
        const newZoom = viewport.zoom * zoomFactor;
        zoomTo(newZoom, pointer);
      }
    }
  }, [viewport.zoom, viewport.panX, viewport.panY, zoomTo, setViewport]);

  // Element event handlers
  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    if (activeTool !== 'select') return;
    if (shiftKey) {
      toggleSelection(id);
    } else {
      // Also select grouped elements
      const el = elements.find((e) => e.id === id);
      if (el?.groupId) {
        const groupIds = elements.filter((e) => e.groupId === el.groupId).map((e) => e.id);
        select(groupIds);
      } else {
        select([id]);
      }
    }
  }, [activeTool, select, toggleSelection, elements]);

  const handleDragStart = useCallback((id: string) => {
    if (!dragStarted.current) {
      pushHistory();
      dragStarted.current = true;
    }
    if (!selectedIds.has(id)) {
      const el = elements.find((e) => e.id === id);
      if (el?.groupId) {
        const groupIds = elements.filter((e) => e.groupId === el.groupId).map((e) => e.id);
        select(groupIds);
      } else {
        select([id]);
      }
    }
  }, [selectedIds, select, elements, pushHistory]);

  const handleDragMove = useCallback((id: string, x: number, y: number) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    // Apply snapping
    const result = snapPosition(
      x, y, element.width, element.height,
      elements, id,
      { snapToGrid: snapGridEnabled, snapToElements: snapElementsEnabled, gridSize },
    );

    setActiveGuides(result.guides);
    updateElement(id, { x: result.x, y: result.y });

    // Move grouped elements together
    if (element.groupId) {
      const dx = result.x - element.x;
      const dy = result.y - element.y;
      elements
        .filter((el) => el.groupId === element.groupId && el.id !== id)
        .forEach((el) => updateElement(el.id, { x: el.x + dx, y: el.y + dy }));
    }

    // Update all arrows bound to this element (and grouped elements)
    const movedIds = new Set([id]);
    if (element.groupId) {
      elements.filter((el) => el.groupId === element.groupId).forEach((el) => movedIds.add(el.id));
    }
    // Build updated elements list with new positions for recalculation
    const updatedElements = elements.map((el) => {
      if (el.id === id) return { ...el, x: result.x, y: result.y };
      if (element.groupId && el.groupId === element.groupId && el.id !== id) {
        const ddx = result.x - element.x;
        const ddy = result.y - element.y;
        return { ...el, x: el.x + ddx, y: el.y + ddy };
      }
      return el;
    });
    for (const el of elements) {
      if (el.type !== 'line' && el.type !== 'arrow') continue;
      const startBound = el.startBinding && movedIds.has(el.startBinding.elementId);
      const endBound = el.endBinding && movedIds.has(el.endBinding.elementId);
      if (startBound || endBound) {
        const updates = recalcBoundArrow(el, updatedElements);
        if (updates) updateElement(el.id, updates);
      }
    }
  }, [elements, updateElement, snapGridEnabled, snapElementsEnabled, gridSize]);

  const handleDragEnd = useCallback(() => {
    setActiveGuides([]);
    dragStarted.current = false;
  }, []);

  const handleTextDblClick = useCallback((id: string) => {
    const element = elements.find((el) => el.id === id);
    if (!element || element.type !== 'text') return;

    setEditingTextId(id);

    const stage = stageRef.current;
    if (!stage) return;

    const textNode = stage.findOne(`#${id}`);
    if (!textNode) return;

    const textPosition = textNode.getClientRect();
    const input = document.createElement('textarea');
    input.value = element.text ?? '';
    input.style.position = 'absolute';
    input.style.top = `${textPosition.y}px`;
    input.style.left = `${textPosition.x}px`;
    input.style.width = `${Math.max(textPosition.width, 100)}px`;
    input.style.height = `${Math.max(textPosition.height, 30)}px`;
    input.style.fontSize = `${(element.fontSize ?? 16) * viewport.zoom}px`;
    input.style.border = '2px solid #007AFF';
    input.style.borderRadius = '4px';
    input.style.padding = '2px 4px';
    input.style.outline = 'none';
    input.style.resize = 'none';
    input.style.background = 'white';
    input.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
    input.style.zIndex = '1000';

    const container = stage.container().parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(input);
    }

    input.focus();
    input.select();

    const handleBlur = () => {
      pushHistory();
      updateElement(id, { text: input.value });
      input.remove();
      setEditingTextId(null);
    };

    input.addEventListener('blur', handleBlur);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
        input.blur();
      }
    });
  }, [elements, viewport.zoom, updateElement, pushHistory]);

  // Arrow endpoint drag handlers
  const handleEndpointDragStart = useCallback((elementId: string, pointIndex: number) => {
    pushHistory();
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;
    const pts = el.points ?? [0, 0, el.width, el.height];
    const absX = el.x + (pts[pointIndex * 2] ?? 0);
    const absY = el.y + (pts[pointIndex * 2 + 1] ?? 0);
    setDraggingEndpoint({ elementId, pointIndex, x: absX, y: absY });
    endpointAnchor.current = null;
  }, [elements, pushHistory]);

  const handleEndpointDragMove = useCallback((elementId: string, pointIndex: number, x: number, y: number) => {
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;

    const pts = el.points ? [...el.points] : [0, 0, el.width, el.height];
    const totalPoints = pts.length / 2;
    const isStart = pointIndex === 0;
    const isEnd = pointIndex === totalPoints - 1;

    // Snap endpoints to shape anchors
    let snapX = x;
    let snapY = y;
    if (isStart || isEnd) {
      const anchor = findNearestAnchor(x, y, elements, elementId);
      endpointAnchor.current = anchor;
      if (anchor) {
        snapX = anchor.x;
        snapY = anchor.y;
      }
    }

    setDraggingEndpoint({ elementId, pointIndex, x: snapX, y: snapY });

    if (isStart) {
      // Moving start point: shift the element origin, adjust all other points
      const dx = snapX - el.x;
      const dy = snapY - el.y;
      const newPts = [...pts];
      // Adjust all points except start to stay in same absolute position
      for (let i = 2; i < newPts.length; i += 2) {
        newPts[i] -= dx;
        newPts[i + 1] -= dy;
      }
      newPts[0] = 0;
      newPts[1] = 0;
      updateElement(elementId, { x: snapX, y: snapY, points: newPts });
    } else {
      // Moving midpoint or end: just update the relative point
      const newPts = [...pts];
      newPts[pointIndex * 2] = snapX - el.x;
      newPts[pointIndex * 2 + 1] = snapY - el.y;
      updateElement(elementId, { points: newPts });
    }
  }, [elements, updateElement]);

  const handleEndpointDragEnd = useCallback((elementId: string, pointIndex: number) => {
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;

    const pts = el.points ?? [0, 0, el.width, el.height];
    const totalPoints = pts.length / 2;
    const isStart = pointIndex === 0;
    const isEnd = pointIndex === totalPoints - 1;

    // Update bindings for endpoints
    if (isStart || isEnd) {
      const anchor = endpointAnchor.current;
      const bindingUpdate: Partial<Element> = {};
      if (isStart) {
        bindingUpdate.startBinding = anchor
          ? { elementId: anchor.elementId, anchor: anchor.anchor }
          : undefined;
      } else {
        bindingUpdate.endBinding = anchor
          ? { elementId: anchor.elementId, anchor: anchor.anchor }
          : undefined;
      }
      updateElement(elementId, bindingUpdate);
    }

    setDraggingEndpoint(null);
    endpointAnchor.current = null;
  }, [elements, updateElement]);

  const handleSegmentDblClick = useCallback((elementId: string, segmentIndex: number, x: number, y: number) => {
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;

    pushHistory();
    const pts = el.points ? [...el.points] : [0, 0, el.width, el.height];
    // Insert a new point after segmentIndex (relative to element position)
    const insertAt = (segmentIndex + 1) * 2;
    const relX = x - el.x;
    const relY = y - el.y;
    pts.splice(insertAt, 0, relX, relY);
    updateElement(elementId, { points: pts, autoRoute: false });
  }, [elements, updateElement, pushHistory]);

  // Context menu
  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (!onContextMenu) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const clickedOnEmpty = e.target === e.target.getStage();
    const elementId = clickedOnEmpty ? undefined : e.target.id();

    if (elementId && !selectedIds.has(elementId)) {
      select([elementId]);
    }

    onContextMenu({ x: pointer.x, y: pointer.y, elementId });
  }, [onContextMenu, selectedIds, select]);

  const cursor = isSpaceDown || isPanning ? (isPanning ? 'grabbing' : 'grab') : getCursor();

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div style={{ cursor, width, height }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.panX}
        y={viewport.panY}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <Layer listening={false}>
          <GridLayer
            width={width}
            height={height}
            zoom={viewport.zoom}
            panX={viewport.panX}
            panY={viewport.panY}
          />
        </Layer>
        <Layer>
          {sortedElements.map((element) => (
            <ShapeRenderer
              key={element.id}
              element={element}
              isSelected={selectedIds.has(element.id)}
              onSelect={handleSelect}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onTextDblClick={handleTextDblClick}
            />
          ))}
          {drawingElement && (
            <ShapeRenderer
              element={drawingElement}
              isSelected={false}
              onSelect={() => {}}
              onDragStart={() => {}}
              onDragMove={() => {}}
              onDragEnd={() => {}}
              onTextDblClick={() => {}}
            />
          )}
          {(activeTool === 'line' || activeTool === 'arrow') && (() => {
            const endpoint = getDrawingEndpoint();
            const snapped = getSnappedAnchor();
            return endpoint ? (
              <ConnectionPoints
                elements={elements}
                nearX={endpoint.x}
                nearY={endpoint.y}
                snappedAnchor={snapped}
              />
            ) : null;
          })()}
          {activeTool === 'select' && elements
            .filter((el) => (el.type === 'line' || el.type === 'arrow') && selectedIds.has(el.id))
            .map((el) => (
              <ArrowControls
                key={`ctrl-${el.id}`}
                element={el}
                onEndpointDragStart={handleEndpointDragStart}
                onEndpointDragMove={handleEndpointDragMove}
                onEndpointDragEnd={handleEndpointDragEnd}
                onSegmentDblClick={handleSegmentDblClick}
              />
            ))}
          {draggingEndpoint && (
            <ConnectionPoints
              elements={elements}
              nearX={draggingEndpoint.x}
              nearY={draggingEndpoint.y}
              snappedAnchor={endpointAnchor.current}
            />
          )}
          <SnapGuides
            guides={activeGuides}
            viewportWidth={width}
            viewportHeight={height}
            zoom={viewport.zoom}
            panX={viewport.panX}
            panY={viewport.panY}
          />
          {selectionBox && (
            <SelectionBox
              visible={true}
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
            />
          )}
          <SelectionLayer stageRef={stageRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default FlowbaseCanvas;
