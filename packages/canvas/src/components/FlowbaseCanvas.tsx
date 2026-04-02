'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Text, Group } from 'react-konva';
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
import LaserLayer from './LaserLayer';
import type { LaserTrail } from './LaserLayer';
import { recalcBoundArrow, findNearestAnchor } from '../utils/connectors';
import { useCollaboration } from '../collaboration/useCollaboration';
import { usePresence } from '../collaboration/usePresence';
import RemoteCursors from '../collaboration/RemoteCursors';
import RemoteSelections from '../collaboration/RemoteSelections';

export interface LayoutPreviewPosition {
  id: string;
  x: number;
  y: number;
}

interface FlowbaseCanvasProps {
  width: number;
  height: number;
  stageRef?: React.RefObject<Konva.Stage | null>;
  onContextMenu?: (e: { x: number; y: number; elementId?: string }) => void;
  layoutPreview?: LayoutPreviewPosition[] | null;
}

const NOOP = () => {};
const NOOP_SELECT = (_id: string, _shift: boolean) => {};
const NOOP_DRAG_MOVE = (_id: string, _x: number, _y: number) => {};
const NOOP_DRAG = (_id: string) => {};

const FlowbaseCanvas = ({ width, height, stageRef: externalStageRef, onContextMenu, layoutPreview }: FlowbaseCanvasProps) => {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef ?? internalStageRef;
  const elements = useCanvasStore((s) => s.elements);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const viewport = useCanvasStore((s) => s.viewport);
  const drawingElement = useCanvasStore((s) => s.drawingElement);
  const snapGridEnabled = useCanvasStore((s) => s.snapToGrid);
  const snapElementsEnabled = useCanvasStore((s) => s.snapToElements);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const select = useCanvasStore((s) => s.select);
  const toggleSelection = useCanvasStore((s) => s.toggleSelection);
  const deselect = useCanvasStore((s) => s.deselect);
  const updateElement = useCanvasStore((s) => s.updateElement);
  const batchUpdateElements = useCanvasStore((s) => s.batchUpdateElements);
  const deleteElements = useCanvasStore((s) => s.deleteElements);
  const copy = useCanvasStore((s) => s.copy);
  const paste = useCanvasStore((s) => s.paste);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const group = useCanvasStore((s) => s.group);
  const ungroup = useCanvasStore((s) => s.ungroup);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const sendToBack = useCanvasStore((s) => s.sendToBack);
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const zoomTo = useCanvasStore((s) => s.zoomTo);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const { onMouseDown, onMouseMove, onMouseUp, getCursor, getDrawingEndpoint, getSnappedAnchor } = useToolHandlers();

  // Collaboration presence
  const { awareness } = useCollaboration();
  const { remoteUsers, updateCursor, clearCursor } = usePresence(awareness);

  // Space+drag panning
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number; lastPanX?: number; lastPanY?: number } | null>(null);

  // Snap guides
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);

  // Track if drag has started (for history push)
  const dragStarted = useRef(false);
  const prevDragSelectIds = useRef<string[]>([]);

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

  // Laser pointer
  const [laserTrails, setLaserTrails] = useState<LaserTrail[]>([]);
  const laserIdCounter = useRef(0);
  const isLaserDrawing = useRef(false);
  const laserLastPoint = useRef<{ x: number; y: number } | null>(null);

  // Eraser
  const isErasing = useRef(false);
  const erasedIds = useRef<Set<string>>(new Set());

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

  const handleLaserCleanup = useCallback((expiredIds: number[]) => {
    setLaserTrails((prev) => prev.filter((t) => !expiredIds.includes(t.id)));
  }, []);

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

    if (activeTool === 'laser') {
      const pos = getCanvasPos(e);
      isLaserDrawing.current = true;
      laserLastPoint.current = { x: pos.x, y: pos.y };
      return;
    }

    if (activeTool === 'eraser') {
      isErasing.current = true;
      erasedIds.current = new Set();
      if (!clickedOnEmpty) {
        const targetId = e.target.id() || e.target.parent?.id();
        if (targetId && targetId !== '__drawing__') {
          pushHistory();
          erasedIds.current.add(targetId);
          deleteElements([targetId]);
        }
      }
      return;
    }

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
  }, [isSpaceDown, activeTool, viewport, deselect, getCanvasPos, onMouseDown, pushHistory, deleteElements]);

  const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Always broadcast cursor for collaboration, regardless of active tool
    const cursorPos = getCanvasPos(e);
    updateCursor(cursorPos.x, cursorPos.y);

    // Eraser drag — delete elements as cursor passes over them
    if (isErasing.current && activeTool === 'eraser') {
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          const shape = stage.getIntersection(pos);
          if (shape) {
            const targetId = shape.id() || shape.parent?.id();
            if (targetId && targetId !== '__drawing__' && !erasedIds.current.has(targetId)) {
              if (erasedIds.current.size === 0) pushHistory();
              erasedIds.current.add(targetId);
              deleteElements([targetId]);
            }
          }
        }
      }
      return;
    }

    // Laser drawing — emit a segment from previous point to current point
    if (isLaserDrawing.current && activeTool === 'laser') {
      const pos = getCanvasPos(e);
      const prev = laserLastPoint.current;
      if (prev) {
        const id = ++laserIdCounter.current;
        setLaserTrails((trails) => [
          ...trails,
          { id, points: [prev.x, prev.y, pos.x, pos.y], createdAt: performance.now() },
        ]);
      }
      laserLastPoint.current = { x: pos.x, y: pos.y };
      return;
    }

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

      const ids = elementsRef.current
        .filter((el) => {
          return el.x >= x && el.y >= y && el.x + el.width <= x + w && el.y + el.height <= y + h;
        })
        .map((el) => el.id);

      const prev = prevDragSelectIds.current;
      if (ids.length !== prev.length || ids.some((id, i) => id !== prev[i])) {
        prevDragSelectIds.current = ids;
        select(ids);
      }
      return;
    }

    const pos = getCanvasPos(e);
    onMouseMove(pos.x, pos.y);
  }, [isPanning, selectionBox, activeTool, getCanvasPos, onMouseMove, setViewport, select, pushHistory, deleteElements, updateCursor]);

  const handleStageMouseUp = useCallback(() => {
    if (isLaserDrawing.current) {
      isLaserDrawing.current = false;
      laserLastPoint.current = null;
      return;
    }

    if (isErasing.current) {
      isErasing.current = false;
      erasedIds.current = new Set();
      return;
    }

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
      prevDragSelectIds.current = [];
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
      const el = elementsRef.current.find((e) => e.id === id);
      if (el?.groupId) {
        const groupIds = elementsRef.current.filter((e) => e.groupId === el.groupId).map((e) => e.id);
        select(groupIds);
      } else {
        select([id]);
      }
    }
  }, [activeTool, select, toggleSelection]);

  const handleDragStart = useCallback((id: string) => {
    if (!dragStarted.current) {
      pushHistory();
      dragStarted.current = true;
    }
    if (!selectedIds.has(id)) {
      const el = elementsRef.current.find((e) => e.id === id);
      if (el?.groupId) {
        const groupIds = elementsRef.current.filter((e) => e.groupId === el.groupId).map((e) => e.id);
        select(groupIds);
      } else {
        select([id]);
      }
    }
  }, [selectedIds, select, pushHistory]);

  const handleDragMove = useCallback((id: string, x: number, y: number) => {
    const elements = elementsRef.current;
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const result = snapPosition(
      x, y, element.width, element.height,
      elements, id,
      { snapToGrid: snapGridEnabled, snapToElements: snapElementsEnabled, gridSize },
    );

    setActiveGuides(result.guides);

    const updates = new Map<string, Partial<Element>>();
    updates.set(id, { x: result.x, y: result.y });

    // Move grouped elements together
    if (element.groupId) {
      const dx = result.x - element.x;
      const dy = result.y - element.y;
      elements
        .filter((el) => el.groupId === element.groupId && el.id !== id)
        .forEach((el) => updates.set(el.id, { x: el.x + dx, y: el.y + dy }));
    }

    // Update all arrows bound to moved elements
    const movedIds = new Set([id]);
    if (element.groupId) {
      elements.filter((el) => el.groupId === element.groupId).forEach((el) => movedIds.add(el.id));
    }

    // Build updated elements list with new positions for recalculation
    const updatedElements = elements.map((el) => {
      const u = updates.get(el.id);
      return u ? { ...el, ...u } : el;
    });

    for (const el of elements) {
      if (el.type !== 'line' && el.type !== 'arrow') continue;
      const startBound = el.startBinding && movedIds.has(el.startBinding.elementId);
      const endBound = el.endBinding && movedIds.has(el.endBinding.elementId);
      if (startBound || endBound) {
        const arrowUpdates = recalcBoundArrow(el, updatedElements);
        if (arrowUpdates) updates.set(el.id, { ...updates.get(el.id), ...arrowUpdates });
      }
    }

    batchUpdateElements(updates);
  }, [snapGridEnabled, snapElementsEnabled, gridSize, batchUpdateElements]);

  const handleDragEnd = useCallback(() => {
    setActiveGuides([]);
    dragStarted.current = false;
  }, []);

  const handleTextDblClick = useCallback((id: string) => {
    const element = elementsRef.current.find((el) => el.id === id);
    if (!element) return;
    const editableTypes = ['text', 'rectangle', 'ellipse', 'diamond', 'stickynote'];
    if (!editableTypes.includes(element.type)) return;

    setEditingTextId(id);

    const stage = stageRef.current;
    if (!stage) return;

    const node = stage.findOne(`#${id}`);
    if (!node) return;

    const nodeRect = node.getClientRect();
    const input = document.createElement('textarea');
    input.value = element.text ?? '';
    input.style.position = 'absolute';
    input.style.top = `${nodeRect.y}px`;
    input.style.left = `${nodeRect.x}px`;
    input.style.width = `${Math.max(nodeRect.width, 100)}px`;
    input.style.height = `${Math.max(nodeRect.height, 30)}px`;
    const isNote = element.type === 'stickynote';
    input.style.fontSize = `${(element.fontSize ?? (element.type === 'text' ? 16 : 14)) * viewport.zoom}px`;
    input.style.textAlign = element.type === 'text' || isNote ? 'left' : 'center';
    input.style.border = '2px solid #7c3aed';
    input.style.borderRadius = isNote ? '3px' : '4px';
    input.style.padding = isNote ? `${12 * viewport.zoom}px` : '2px 4px';
    input.style.outline = 'none';
    input.style.resize = 'none';
    input.style.background = isNote ? (element.fill || '#fef08a') : 'white';
    input.style.color = isNote ? (element.stroke || '#713f12') : 'inherit';
    input.style.lineHeight = isNote ? '1.4' : 'normal';
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
  }, [viewport.zoom, updateElement, pushHistory]);

  // Arrow endpoint drag handlers
  const handleEndpointDragStart = useCallback((elementId: string, pointIndex: number) => {
    pushHistory();
    const el = elementsRef.current.find((e) => e.id === elementId);
    if (!el) return;
    const pts = el.points ?? [0, 0, el.width, el.height];
    const absX = el.x + (pts[pointIndex * 2] ?? 0);
    const absY = el.y + (pts[pointIndex * 2 + 1] ?? 0);
    setDraggingEndpoint({ elementId, pointIndex, x: absX, y: absY });
    endpointAnchor.current = null;
  }, [pushHistory]);

  const handleEndpointDragMove = useCallback((elementId: string, pointIndex: number, x: number, y: number) => {
    const elements = elementsRef.current;
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;

    const pts = el.points ? [...el.points] : [0, 0, el.width, el.height];
    const totalPoints = pts.length / 2;
    const isStart = pointIndex === 0;
    const isEnd = pointIndex === totalPoints - 1;

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
      const dx = snapX - el.x;
      const dy = snapY - el.y;
      const newPts = [...pts];
      for (let i = 2; i < newPts.length; i += 2) {
        newPts[i] -= dx;
        newPts[i + 1] -= dy;
      }
      newPts[0] = 0;
      newPts[1] = 0;
      updateElement(elementId, { x: snapX, y: snapY, points: newPts });
    } else {
      const newPts = [...pts];
      newPts[pointIndex * 2] = snapX - el.x;
      newPts[pointIndex * 2 + 1] = snapY - el.y;
      updateElement(elementId, { points: newPts });
    }
  }, [updateElement]);

  const handleEndpointDragEnd = useCallback((elementId: string, pointIndex: number) => {
    const el = elementsRef.current.find((e) => e.id === elementId);
    if (!el) return;

    const pts = el.points ?? [0, 0, el.width, el.height];
    const totalPoints = pts.length / 2;
    const isStart = pointIndex === 0;
    const isEnd = pointIndex === totalPoints - 1;

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
  }, [updateElement]);

  const handleSegmentDblClick = useCallback((elementId: string, segmentIndex: number, x: number, y: number) => {
    const el = elementsRef.current.find((e) => e.id === elementId);
    if (!el) return;

    pushHistory();
    const pts = el.points ? [...el.points] : [0, 0, el.width, el.height];
    const insertAt = (segmentIndex + 1) * 2;
    const relX = x - el.x;
    const relY = y - el.y;
    pts.splice(insertAt, 0, relX, relY);
    updateElement(elementId, { points: pts, autoRoute: false });
  }, [updateElement, pushHistory]);

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

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  return (
    <div className="canvas-cursor" style={{ '--canvas-cursor': cursor, width, height } as React.CSSProperties}>
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
        onMouseLeave={clearCursor}
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
              onSelect={NOOP_SELECT}
              onDragStart={NOOP_DRAG}
              onDragMove={NOOP_DRAG_MOVE}
              onDragEnd={NOOP}
              onTextDblClick={NOOP_DRAG}
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
          {laserTrails.length > 0 && (
            <LaserLayer trails={laserTrails} onCleanup={handleLaserCleanup} />
          )}
          <SelectionLayer stageRef={stageRef} />
        </Layer>
        {/* Remote presence layer */}
        {remoteUsers.length > 0 && (
          <Layer listening={false}>
            <RemoteSelections remoteUsers={remoteUsers} elements={elements} />
            <RemoteCursors remoteUsers={remoteUsers} />
          </Layer>
        )}
        {/* Layout preview ghost layer */}
        {layoutPreview && layoutPreview.length > 0 && (
          <Layer listening={false}>
            {layoutPreview.map((pos) => {
              const el = elements.find((e) => e.id === pos.id);
              if (!el) return null;

              const currentCenterX = el.x + el.width / 2;
              const currentCenterY = el.y + el.height / 2;
              const newCenterX = pos.x + el.width / 2;
              const newCenterY = pos.y + el.height / 2;

              return (
                <Group key={`ghost-${pos.id}`}>
                  {/* Movement line */}
                  <Line
                    points={[currentCenterX, currentCenterY, newCenterX, newCenterY]}
                    stroke="#228BE6"
                    strokeWidth={1}
                    dash={[4, 4]}
                    opacity={0.4}
                  />
                  {/* Ghost shape */}
                  {el.type === 'ellipse' ? (
                    <Ellipse
                      x={pos.x + el.width / 2}
                      y={pos.y + el.height / 2}
                      radiusX={el.width / 2}
                      radiusY={el.height / 2}
                      stroke="#228BE6"
                      strokeWidth={2}
                      dash={[6, 4]}
                      opacity={0.3}
                    />
                  ) : el.type === 'diamond' ? (
                    <Line
                      points={[
                        pos.x + el.width / 2, pos.y,
                        pos.x + el.width, pos.y + el.height / 2,
                        pos.x + el.width / 2, pos.y + el.height,
                        pos.x, pos.y + el.height / 2,
                      ]}
                      closed
                      stroke="#228BE6"
                      strokeWidth={2}
                      dash={[6, 4]}
                      opacity={0.3}
                    />
                  ) : el.type === 'text' ? (
                    <Text
                      x={pos.x}
                      y={pos.y}
                      width={el.width}
                      height={el.height}
                      text={el.text ?? ''}
                      fontSize={el.fontSize ?? 16}
                      fill="#228BE6"
                      opacity={0.3}
                    />
                  ) : (
                    <Rect
                      x={pos.x}
                      y={pos.y}
                      width={el.width}
                      height={el.height}
                      stroke="#228BE6"
                      strokeWidth={2}
                      dash={[6, 4]}
                      opacity={0.3}
                      cornerRadius={el.type === 'rectangle' ? 4 : 0}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        )}
      </Stage>
    </div>
  );
};

export default FlowbaseCanvas;
