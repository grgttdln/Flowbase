'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FlowbaseCanvas, useCanvasStore } from '@flowbase/canvas';
import type Konva from 'konva';
import type { ToolType, AIActionType } from '@flowbase/shared';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAIAction } from '@/hooks/useAIAction';
import ToolPicker from '../toolbar/ToolPicker';
import LogoPill from '../toolbar/LogoPill';
import ActionGroup from '../toolbar/ActionGroup';
import ZoomControls from '../toolbar/ZoomControls';
import SaveIndicator from '../toolbar/SaveIndicator';
import ExportDialog from '../dialogs/ExportDialog';
import ContextMenu, { type ContextMenuAction } from './ContextMenu';
import AIResponsePopover from '../ai/AIResponsePopover';
import SettingsPanel from '../dialogs/SettingsPanel';
import PropertiesSidebar from '../properties/PropertiesSidebar';

interface CanvasEditorProps {
  projectId: string;
  projectName: string;
}

const CanvasEditor = ({ projectId, projectName }: CanvasEditorProps) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsHint, setSettingsHint] = useState<string | undefined>();
  const [aiPopover, setAiPopover] = useState<{ x: number; y: number } | null>(null);
  const [lastAIAction, setLastAIAction] = useState<{ action: AIActionType; ids?: string[] } | null>(null);
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
    elements,
    group,
    ungroup,
    bringForward,
    sendBackward,
  } = useCanvasStore();

  const { status: saveStatus, flushSave } = useAutoSave(projectId, stageRef);
  const ai = useAIAction();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);

  // Open settings if no API key
  useEffect(() => {
    if (ai.needsApiKey) {
      setSettingsHint('Enter your OpenRouter API key to use AI features.');
      setSettingsOpen(true);
    }
  }, [ai.needsApiKey]);

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

  const runAIAction = useCallback(
    (action: AIActionType, menuX: number, menuY: number) => {
      const ids = Array.from(selectedIds);
      const scene = { version: 1, elements };
      setLastAIAction({ action, ids: ids.length > 0 ? ids : undefined });
      setAiPopover({ x: menuX, y: menuY + 8 });
      ai.reset();
      ai.run(action, scene, ids.length > 0 ? ids : undefined);
    },
    [selectedIds, elements, ai],
  );

  const handleRetryAI = useCallback(() => {
    if (!lastAIAction) return;
    const scene = { version: 1, elements };
    ai.reset();
    ai.run(lastAIAction.action, scene, lastAIAction.ids);
  }, [lastAIAction, elements, ai]);

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
        if (contextMenu) {
          runAIAction(action, contextMenu.x, contextMenu.y);
        }
        break;
    }
  }, [copy, paste, deleteElements, selectedIds, group, ungroup, bringForward, sendBackward, contextMenu, runAIAction]);

  if (dimensions.width === 0) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Canvas */}
      <FlowbaseCanvas
        width={dimensions.width}
        height={dimensions.height}
        stageRef={stageRef}
        onContextMenu={handleContextMenu}
      />

      {/* Logo — top left */}
      <div className="absolute left-4 top-4 z-10">
        <LogoPill href="/" onBeforeNavigate={flushSave} />
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
          onExport={() => setExportOpen(true)}
          onSettings={() => {
            setSettingsHint(undefined);
            setSettingsOpen(true);
          }}
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
        <SaveIndicator status={saveStatus} onSave={flushSave} />
      </div>

      {/* Properties sidebar */}
      <PropertiesSidebar />

      {/* Export dialog */}
      {exportOpen && (
        <ExportDialog
          projectName={projectName}
          stageRef={stageRef}
          onClose={() => setExportOpen(false)}
        />
      )}

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

      {/* AI Response Popover */}
      {aiPopover && (
        <AIResponsePopover
          x={aiPopover.x}
          y={aiPopover.y}
          text={ai.text}
          isLoading={ai.isLoading}
          error={ai.error}
          onClose={() => {
            ai.abort();
            setAiPopover(null);
          }}
          onRetry={handleRetryAI}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        hint={settingsHint}
      />
    </div>
  );
};

export default CanvasEditor;
