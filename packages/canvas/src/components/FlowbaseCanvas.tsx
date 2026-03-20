'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../store/useCanvasStore';
import { useToolHandlers } from '../tools/useToolHandlers';
import GridLayer from './GridLayer';
import ShapeRenderer from './shapes/ShapeRenderer';
import SelectionLayer from './SelectionLayer';
import SelectionBox from './SelectionBox';

interface FlowbaseCanvasProps {
  width: number;
  height: number;
  onContextMenu?: (e: { x: number; y: number; elementId?: string }) => void;
}

const FlowbaseCanvas = ({ width, height, onContextMenu }: FlowbaseCanvasProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const {
    elements,
    selectedIds,
    activeTool,
    viewport,
    drawingElement,
    select,
    addToSelection,
    toggleSelection,
    deselect,
    updateElement,
    deleteElements,
    copy,
    paste,
    setViewport,
    zoomTo,
  } = useCanvasStore();

  const { onMouseDown, onMouseMove, onMouseUp, getCursor } = useToolHandlers();

  // Space+drag panning
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

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

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 0) {
        e.preventDefault();
        deleteElements(Array.from(selectedIds));
      }
      if (e.metaKey || e.ctrlKey) {
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
  }, [selectedIds, deleteElements, copy, paste, select, elements, editingTextId]);

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
    // Pan
    if (isPanning && panStart.current) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        setViewport({
          panX: panStart.current.panX + (pos.x - panStart.current.x),
          panY: panStart.current.panY + (pos.y - panStart.current.y),
        });
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
      setIsPanning(false);
      panStart.current = null;
      return;
    }

    if (selectionBox) {
      setSelectionBox(null);
      return;
    }

    onMouseUp();
  }, [isPanning, selectionBox, onMouseUp]);

  // Zoom with scroll wheel
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newZoom = direction > 0 ? viewport.zoom * scaleBy : viewport.zoom / scaleBy;

    zoomTo(newZoom, pointer);
  }, [viewport.zoom, zoomTo]);

  // Element event handlers
  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    if (activeTool !== 'select') return;
    if (shiftKey) {
      toggleSelection(id);
    } else {
      select([id]);
    }
  }, [activeTool, select, toggleSelection]);

  const handleDragStart = useCallback((id: string) => {
    if (!selectedIds.has(id)) {
      select([id]);
    }
  }, [selectedIds, select]);

  const handleDragMove = useCallback((id: string, x: number, y: number) => {
    updateElement(id, { x, y });
  }, [updateElement]);

  const handleDragEnd = useCallback((id: string) => {
    // Position already updated via handleDragMove
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
  }, [elements, viewport.zoom, updateElement]);

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
