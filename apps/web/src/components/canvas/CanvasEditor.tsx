'use client';

import { useEffect, useState, useCallback } from 'react';
import { FlowbaseCanvas, useCanvasStore } from '@flowbase/canvas';
import type { ToolType } from '@flowbase/shared';
import ToolPicker from '../toolbar/ToolPicker';
import LogoPill from '../toolbar/LogoPill';
import ActionGroup from '../toolbar/ActionGroup';
import ZoomControls from '../toolbar/ZoomControls';
import SaveIndicator from '../toolbar/SaveIndicator';
import ContextMenu, { type ContextMenuAction } from './ContextMenu';

const CanvasEditor = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const {
    activeTool,
    setTool,
    viewport,
    zoomTo,
    undo,
    redo,
    canUndo,
    canRedo,
    copy,
    paste,
    deleteElements,
    selectedIds,
    group,
    ungroup,
    bringForward,
    sendBackward,
  } = useCanvasStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Tool shortcuts
  useEffect(() => {
    const SHORTCUTS: Record<string, ToolType> = {
      v: 'select',
      r: 'rectangle',
      o: 'ellipse',
      d: 'diamond',
      l: 'line',
      a: 'arrow',
      p: 'freehand',
      t: 'text',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const tool = SHORTCUTS[e.key.toLowerCase()];
      if (tool) setTool(tool);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  const handleContextMenu = useCallback((e: { x: number; y: number; elementId?: string }) => {
    setContextMenu(e);
  }, []);

  const handleContextMenuAction = useCallback((action: ContextMenuAction) => {
    switch (action) {
      case 'copy':
        copy();
        break;
      case 'paste':
        paste();
        break;
      case 'delete':
        deleteElements(Array.from(selectedIds));
        break;
      case 'group':
        group();
        break;
      case 'ungroup':
        ungroup();
        break;
      case 'bringForward':
        bringForward();
        break;
      case 'sendBackward':
        sendBackward();
        break;
      case 'explain':
      case 'suggest':
      case 'summarize':
        // AI actions — will be wired in Phase 6
        break;
    }
  }, [copy, paste, deleteElements, selectedIds, group, ungroup, bringForward, sendBackward]);

  if (dimensions.width === 0) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Canvas */}
      <FlowbaseCanvas
        width={dimensions.width}
        height={dimensions.height}
        onContextMenu={handleContextMenu}
      />

      {/* Logo — top left */}
      <div className="absolute left-4 top-4 z-10">
        <LogoPill />
      </div>

      {/* Tool picker — center top */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <ToolPicker activeTool={activeTool} onToolChange={setTool} />
      </div>

      {/* Actions — top right */}
      <div className="absolute right-4 top-4 z-10">
        <ActionGroup
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={undo}
          onRedo={redo}
          onExport={() => {/* Phase 5 */}}
          onSettings={() => {/* Phase 6 */}}
        />
      </div>

      {/* Zoom — bottom left */}
      <div className="absolute bottom-4 left-4 z-10">
        <ZoomControls
          zoom={viewport.zoom}
          onZoomIn={() => zoomTo(viewport.zoom * 1.2)}
          onZoomOut={() => zoomTo(viewport.zoom / 1.2)}
        />
      </div>

      {/* Save indicator — bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <SaveIndicator status="saved" />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasSelection={selectedIds.size > 0}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default CanvasEditor;
