import { useCallback, useRef } from 'react';
import type { ToolType, Element } from '@flowbase/shared';
import { DEFAULT_ELEMENT_PROPS, DEFAULT_STROKE, generateId } from '@flowbase/shared';
import { useCanvasStore } from '../store/useCanvasStore';
import { useStyleDefaults, getToolCategory } from '../store/useStyleDefaults';

export const useToolHandlers = () => {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const freehandPoints = useRef<number[]>([]);

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
    if (activeTool === 'select') return;

    startPos.current = { x, y };
    setIsDrawing(true);

    if (activeTool === 'freehand') {
      freehandPoints.current = [0, 0];
      const tempElement: Element = {
        id: '__drawing__',
        type: 'freehand',
        x,
        y,
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
    } else {
      const tempElement: Element = {
        id: '__drawing__',
        type: activeTool as Element['type'],
        x,
        y,
        width: 0,
        height: 0,
        points: activeTool === 'line' || activeTool === 'arrow' ? [0, 0, 0, 0] : undefined,
        zIndex: 0,
        ...getShapeDefaults(),
      };
      setDrawingElement(tempElement);
    }
  }, [activeTool, addElement, setIsDrawing, setDrawingElement, getShapeDefaults]);

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
      setDrawingElement({
        ...drawingElement,
        points: [0, 0, dx, dy],
        width: Math.abs(dx),
        height: Math.abs(dy),
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
      addElement(rest);
    }

    setDrawingElement(null);
    setIsDrawing(false);
    startPos.current = null;
    freehandPoints.current = [];
  }, [isDrawing, drawingElement, activeTool, addElement, setDrawingElement, setIsDrawing]);

  const getCursor = useCallback((): string => {
    switch (activeTool) {
      case 'select':
        return 'default';
      case 'text':
        return 'text';
      default:
        return 'crosshair';
    }
  }, [activeTool]);

  return { onMouseDown, onMouseMove, onMouseUp, getCursor };
};
