import { useCallback, useRef } from 'react';
import type { ToolType, Element, Binding } from '@flowbase/shared';
import { DEFAULT_ELEMENT_PROPS, DEFAULT_STROKE, generateId } from '@flowbase/shared';
import { useCanvasStore } from '../store/useCanvasStore';
import { useStyleDefaults, getToolCategory } from '../store/useStyleDefaults';
import { findNearestAnchor, recalcBoundArrow, type AnchorPoint } from '../utils/connectors';
import { CURSOR_SELECT, CURSOR_PLUS, CURSOR_CROSSHAIR, CURSOR_PENCIL, CURSOR_ERASER, CURSOR_LASER, CURSOR_STICKYNOTE } from './cursors';

export const useToolHandlers = () => {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const freehandPoints = useRef<number[]>([]);
  const startAnchor = useRef<AnchorPoint | null>(null);
  const endAnchor = useRef<AnchorPoint | null>(null);

  const {
    activeTool,
    addElement,
    setIsDrawing,
    isDrawing,
    drawingElement,
    setDrawingElement,
    updateElement,
    elements,
  } = useCanvasStore();

  const styleDefaults = useStyleDefaults();

  const getShapeDefaults = useCallback(() => {
    const category = getToolCategory(activeTool);
    if (category) {
      const defaults = styleDefaults[category];
      return {
        ...DEFAULT_ELEMENT_PROPS,
        stroke: defaults.stroke,
        fill: defaults.fill,
        strokeWidth: defaults.strokeWidth,
        opacity: defaults.opacity,
      };
    }
    return {
      ...DEFAULT_ELEMENT_PROPS,
      stroke: DEFAULT_STROKE,
      fill: 'transparent',
    };
  }, [activeTool, styleDefaults]);

  const onMouseDown = useCallback((x: number, y: number) => {
    if (activeTool === 'select' || activeTool === 'laser' || activeTool === 'eraser') return;

    startAnchor.current = null;
    endAnchor.current = null;

    // Snap start point for line/arrow
    let sx = x;
    let sy = y;
    if (activeTool === 'line' || activeTool === 'arrow') {
      const anchor = findNearestAnchor(x, y, elements);
      if (anchor) {
        sx = anchor.x;
        sy = anchor.y;
        startAnchor.current = anchor;
      }
    }

    startPos.current = { x: sx, y: sy };
    setIsDrawing(true);

    if (activeTool === 'freehand') {
      freehandPoints.current = [0, 0];
      const tempElement: Element = {
        id: '__drawing__',
        type: 'freehand',
        x: sx,
        y: sy,
        width: 0,
        height: 0,
        points: [0, 0],
        zIndex: 0,
        ...getShapeDefaults(),
      };
      setDrawingElement(tempElement);
    } else if (activeTool === 'text') {
      const textDefaults = styleDefaults.text;
      addElement({
        type: 'text',
        x,
        y,
        width: 200,
        height: 30,
        text: 'Text',
        fontSize: textDefaults.fontSize,
        ...getShapeDefaults(),
        stroke: textDefaults.stroke,
      });
      setIsDrawing(false);
    } else if (activeTool === 'stickynote') {
      const noteDefaults = styleDefaults.stickynote;
      addElement({
        type: 'stickynote',
        x: x - 100,
        y: y - 100,
        width: 200,
        height: 200,
        text: '',
        fontSize: noteDefaults.fontSize,
        ...getShapeDefaults(),
        fill: noteDefaults.fill,
        stroke: noteDefaults.stroke,
      });
      setIsDrawing(false);
    } else {
      const tempElement: Element = {
        id: '__drawing__',
        type: activeTool as Element['type'],
        x: sx,
        y: sy,
        width: 0,
        height: 0,
        points: activeTool === 'line' || activeTool === 'arrow' ? [0, 0, 0, 0] : undefined,
        zIndex: 0,
        ...getShapeDefaults(),
      };
      setDrawingElement(tempElement);
    }
  }, [activeTool, addElement, setIsDrawing, setDrawingElement, getShapeDefaults, elements]);

  const onMouseMove = useCallback((x: number, y: number) => {
    if (!isDrawing || !startPos.current || !drawingElement) return;

    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;

    if (activeTool === 'freehand') {
      const relX = x - startPos.current.x;
      const relY = y - startPos.current.y;
      freehandPoints.current = [...freehandPoints.current, relX, relY];
      setDrawingElement({
        ...drawingElement,
        points: [...freehandPoints.current],
      });
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      // Snap end point to nearest anchor
      let endX = x;
      let endY = y;
      const anchor = findNearestAnchor(x, y, elements, startAnchor.current?.elementId);
      if (anchor) {
        endX = anchor.x;
        endY = anchor.y;
        endAnchor.current = anchor;
      } else {
        endAnchor.current = null;
      }
      const sdx = endX - startPos.current!.x;
      const sdy = endY - startPos.current!.y;
      setDrawingElement({
        ...drawingElement,
        points: [0, 0, sdx, sdy],
        width: Math.abs(sdx),
        height: Math.abs(sdy),
      });
    } else {
      const newX = dx >= 0 ? startPos.current.x : x;
      const newY = dy >= 0 ? startPos.current.y : y;
      setDrawingElement({
        ...drawingElement,
        x: newX,
        y: newY,
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    }
  }, [isDrawing, drawingElement, activeTool, setDrawingElement]);

  const onMouseUp = useCallback(() => {
    if (!isDrawing || !drawingElement) {
      setIsDrawing(false);
      return;
    }

    const minSize = activeTool === 'freehand' ? 0 : 5;
    const hasSize =
      activeTool === 'freehand'
        ? (drawingElement.points?.length ?? 0) > 4
        : activeTool === 'line' || activeTool === 'arrow'
          ? Math.abs(drawingElement.points?.[2] ?? 0) > minSize || Math.abs(drawingElement.points?.[3] ?? 0) > minSize
          : drawingElement.width > minSize || drawingElement.height > minSize;

    if (hasSize) {
      const { id, zIndex, ...rest } = drawingElement;
      // Attach bindings for line/arrow
      if ((activeTool === 'line' || activeTool === 'arrow') && (startAnchor.current || endAnchor.current)) {
        if (startAnchor.current) {
          rest.startBinding = { elementId: startAnchor.current.elementId, anchor: startAnchor.current.anchor };
        }
        if (endAnchor.current) {
          rest.endBinding = { elementId: endAnchor.current.elementId, anchor: endAnchor.current.anchor };
        }
        // Enable auto-routing when both endpoints are bound
        if (startAnchor.current && endAnchor.current) {
          rest.autoRoute = true;
          // Calculate initial orthogonal route
          const tempArrow = { ...rest, id: '__temp__', zIndex: 0 } as Element;
          const routed = recalcBoundArrow(tempArrow, elements);
          if (routed) {
            Object.assign(rest, routed);
          }
        }
      }
      addElement(rest);
    } else if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'diamond') {
      // Click without drag: create shape with predefined size, centered on click
      const defaultSize = 100;
      const { id, zIndex, ...rest } = drawingElement;
      rest.x = rest.x - defaultSize / 2;
      rest.y = rest.y - defaultSize / 2;
      rest.width = defaultSize;
      rest.height = defaultSize;
      addElement(rest);
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      // Click without drag: create line/arrow with predefined length
      const defaultLength = 150;
      const { id, zIndex, ...rest } = drawingElement;
      rest.points = [0, 0, defaultLength, 0];
      rest.width = defaultLength;
      rest.height = 0;
      addElement(rest);
    }

    setDrawingElement(null);
    setIsDrawing(false);
    startPos.current = null;
    freehandPoints.current = [];
    startAnchor.current = null;
    endAnchor.current = null;
  }, [isDrawing, drawingElement, activeTool, addElement, setDrawingElement, setIsDrawing]);

  const getCursor = useCallback((): string => {
    switch (activeTool) {
      case 'select':
        return CURSOR_SELECT;
      case 'rectangle':
      case 'ellipse':
      case 'diamond':
        return CURSOR_PLUS;
      case 'stickynote':
        return CURSOR_STICKYNOTE;
      case 'line':
      case 'arrow':
        return CURSOR_CROSSHAIR;
      case 'freehand':
        return CURSOR_PENCIL;
      case 'text':
        return 'text';
      case 'eraser':
        return CURSOR_ERASER;
      case 'laser':
        return CURSOR_LASER;
      default:
        return 'crosshair';
    }
  }, [activeTool]);

  /** Current drawing endpoint — used to show connection points nearby */
  const getDrawingEndpoint = useCallback((): { x: number; y: number } | null => {
    if (!isDrawing || !drawingElement || !startPos.current) return null;
    if (activeTool !== 'line' && activeTool !== 'arrow') return null;
    const pts = drawingElement.points;
    if (!pts || pts.length < 4) return null;
    return { x: startPos.current.x + pts[pts.length - 2], y: startPos.current.y + pts[pts.length - 1] };
  }, [isDrawing, drawingElement, activeTool]);

  const getSnappedAnchor = useCallback(() => endAnchor.current, []);

  return { onMouseDown, onMouseMove, onMouseUp, getCursor, getDrawingEndpoint, getSnappedAnchor };
};
