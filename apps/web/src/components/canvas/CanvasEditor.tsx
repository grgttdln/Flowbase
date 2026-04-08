'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FlowbaseCanvas, useCanvasStore, useCollaboration } from '@flowbase/canvas';
import type Konva from 'konva';
import type { ToolType, AIActionType, SavedAIPopover } from '@flowbase/shared';
import { useAutoSave } from '@/hooks/useAutoSave';
import { getAISettings } from '@/hooks/useAIAction';
import ToolPicker from '../toolbar/ToolPicker';
import LogoPill from '../toolbar/LogoPill';
import ActionGroup from '../toolbar/ActionGroup';
import CollaboratorBar from '../toolbar/CollaboratorBar';
import ZoomControls from '../toolbar/ZoomControls';
import SaveIndicator from '../toolbar/SaveIndicator';
import ExportDialog from '../dialogs/ExportDialog';
import ContextMenu, { type ContextMenuAction } from './ContextMenu';
import AIResponsePopover from '../ai/AIResponsePopover';
import SettingsPanel from '../dialogs/SettingsPanel';
import ShortcutsPanel from '../dialogs/ShortcutsPanel';
import PropertiesSidebar from '../properties/PropertiesSidebar';
import StampPanel from '../toolbar/StampPanel';
import GenerateDialog from '../ai/GenerateDialog';
import SharePopover from '../dialogs/SharePopover';

interface AIPopoverInstance {
  id: string;
  x: number;
  y: number;
  action: AIActionType;
  text: string;
  isLoading: boolean;
  error: string | null;
  collapsed: boolean;
  selectedIds?: string[];
}

interface CanvasEditorProps {
  projectId?: string;
  projectName: string;
  savedAIPopovers?: SavedAIPopover[];
}

const CanvasEditor = ({ projectId, projectName, savedAIPopovers }: CanvasEditorProps) => {
  const isCollabMode = !projectId;
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsHint, setSettingsHint] = useState<string | undefined>();
  const [aiPopovers, setAiPopovers] = useState<AIPopoverInstance[]>(() =>
    (savedAIPopovers ?? []).map((p) => ({ ...p, isLoading: false, error: null })),
  );
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const aiPopoversRef = useRef<SavedAIPopover[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const viewport = useCanvasStore((s) => s.viewport);
  const zoomTo = useCanvasStore((s) => s.zoomTo);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);
  const copy = useCanvasStore((s) => s.copy);
  const paste = useCanvasStore((s) => s.paste);
  const deleteElements = useCanvasStore((s) => s.deleteElements);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const elements = useCanvasStore((s) => s.elements);
  const group = useCanvasStore((s) => s.group);
  const ungroup = useCanvasStore((s) => s.ungroup);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const alignLeft = useCanvasStore((s) => s.alignLeft);
  const alignCenterH = useCanvasStore((s) => s.alignCenterH);
  const alignRight = useCanvasStore((s) => s.alignRight);
  const alignTop = useCanvasStore((s) => s.alignTop);
  const alignCenterV = useCanvasStore((s) => s.alignCenterV);
  const alignBottom = useCanvasStore((s) => s.alignBottom);
  const distributeH = useCanvasStore((s) => s.distributeH);
  const distributeV = useCanvasStore((s) => s.distributeV);
  const selectedStamp = useCanvasStore((s) => s.selectedStamp);
  const setSelectedStamp = useCanvasStore((s) => s.setSelectedStamp);
  const { isCollaborating, status: collabStatus, roomId: collabRoomId } = useCollaboration();

  // Keep ref in sync for auto-save (avoids re-creating the save callback on every popover change)
  useEffect(() => {
    aiPopoversRef.current = aiPopovers
      .filter((p) => p.text && !p.isLoading)
      .map(({ id, x, y, action, text, collapsed, selectedIds: sids }) => ({
        id, x, y, action, text, collapsed, selectedIds: sids,
      }));
  }, [aiPopovers]);

  const { status: saveStatus, flushSave, scheduleSave } = useAutoSave(projectId ?? '', stageRef, !isCollabMode, aiPopoversRef);

  // Trigger auto-save when popovers change (close, collapse, move, stream complete)
  const prevPopoversLenRef = useRef(aiPopovers.length);
  useEffect(() => {
    const hasFinished = aiPopovers.every((p) => !p.isLoading);
    const countChanged = aiPopovers.length !== prevPopoversLenRef.current;
    prevPopoversLenRef.current = aiPopovers.length;
    if (hasFinished || countChanged) {
      scheduleSave();
    }
  }, [aiPopovers, scheduleSave]);

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
      s: 'stickynote',
      m: 'stamp',
      k: 'laser',
      e: 'eraser',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      // Alignment shortcuts: Cmd/Ctrl+Shift+key
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'l') { e.preventDefault(); alignLeft(); return; }
        if (key === 'c') { e.preventDefault(); alignCenterH(); return; }
        if (key === 'r') { e.preventDefault(); alignRight(); return; }
        if (key === 't') { e.preventDefault(); alignTop(); return; }
        if (key === 'm') { e.preventDefault(); alignCenterV(); return; }
        if (key === 'b') { e.preventDefault(); alignBottom(); return; }
        if (key === 'h') { e.preventDefault(); distributeH(); return; }
        if (key === 'v') { e.preventDefault(); distributeV(); return; }
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        setShortcutsOpen((prev) => !prev);
        return;
      }

      const tool = SHORTCUTS[e.key.toLowerCase()];
      if (tool) setTool(tool);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, alignLeft, alignCenterH, alignRight, alignTop, alignCenterV, alignBottom, distributeH, distributeV]);

  const handleContextMenu = useCallback((e: { x: number; y: number; elementId?: string }) => {
    setContextMenu(e);
  }, []);

  // Stream AI response for a specific popover
  const streamToPopover = useCallback(
    async (popoverId: string, action: AIActionType, popoverSelectedIds?: string[]) => {
      const { apiKey, model } = getAISettings();
      if (!apiKey) {
        setSettingsHint('Enter your OpenRouter API key to use AI features.');
        setSettingsOpen(true);
        setAiPopovers((prev) => prev.filter((p) => p.id !== popoverId));
        return;
      }

      const controller = new AbortController();
      abortControllers.current.set(popoverId, controller);

      const scene = { version: 1, elements };

      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ action, scene, selectedIds: popoverSelectedIds, model }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (typeof parsed === 'string') {
                setAiPopovers((prev) =>
                  prev.map((p) => (p.id === popoverId ? { ...p, text: p.text + parsed } : p)),
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected') throw e;
            }
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setAiPopovers((prev) =>
          prev.map((p) =>
            p.id === popoverId
              ? { ...p, error: e instanceof Error ? e.message : 'Something went wrong' }
              : p,
          ),
        );
      } finally {
        setAiPopovers((prev) =>
          prev.map((p) => (p.id === popoverId ? { ...p, isLoading: false } : p)),
        );
        abortControllers.current.delete(popoverId);
      }
    },
    [elements],
  );

  const runAIAction = useCallback(
    (action: AIActionType, menuX: number, menuY: number) => {
      const ids = Array.from(selectedIds);
      const popoverId = crypto.randomUUID();
      // Convert screen coordinates to canvas space so popovers pan/zoom with elements
      const { viewport: vp } = useCanvasStore.getState();
      const canvasX = (menuX - vp.panX) / vp.zoom;
      const canvasY = (menuY + 8 - vp.panY) / vp.zoom;
      const instance: AIPopoverInstance = {
        id: popoverId,
        x: canvasX,
        y: canvasY,
        action,
        text: '',
        isLoading: true,
        error: null,
        collapsed: false,
        selectedIds: ids.length > 0 ? ids : undefined,
      };
      setAiPopovers((prev) => [...prev, instance]);
      setActivePopoverId(popoverId);
      streamToPopover(popoverId, action, ids.length > 0 ? ids : undefined);
    },
    [selectedIds, streamToPopover],
  );

  const handleClosePopover = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setAiPopovers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleRetryPopover = useCallback(
    (id: string) => {
      const popover = aiPopovers.find((p) => p.id === id);
      if (!popover) return;
      setAiPopovers((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, text: '', isLoading: true, error: null } : p,
        ),
      );
      streamToPopover(id, popover.action, popover.selectedIds);
    },
    [aiPopovers, streamToPopover],
  );

  const handleMovePopover = useCallback((id: string, screenX: number, screenY: number) => {
    // Convert screen coordinates back to canvas space
    const { viewport: vp } = useCanvasStore.getState();
    const canvasX = (screenX - vp.panX) / vp.zoom;
    const canvasY = (screenY - vp.panY) / vp.zoom;
    setAiPopovers((prev) => prev.map((p) => (p.id === id ? { ...p, x: canvasX, y: canvasY } : p)));
  }, []);

  const handleToggleCollapse = useCallback((id: string) => {
    setAiPopovers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, collapsed: !p.collapsed } : p)),
    );
  }, []);

  const handleActivatePopover = useCallback((id: string) => {
    setActivePopoverId(id);
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
      case 'alignLeft':
        alignLeft();
        break;
      case 'alignCenterH':
        alignCenterH();
        break;
      case 'alignRight':
        alignRight();
        break;
      case 'alignTop':
        alignTop();
        break;
      case 'alignCenterV':
        alignCenterV();
        break;
      case 'alignBottom':
        alignBottom();
        break;
      case 'distributeH':
        distributeH();
        break;
      case 'distributeV':
        distributeV();
        break;
      case 'generate':
        setGenerateOpen(true);
        break;
      case 'explain':
      case 'suggest':
      case 'summarize':
        if (contextMenu) {
          runAIAction(action, contextMenu.x, contextMenu.y);
        }
        break;
    }
  }, [copy, paste, deleteElements, selectedIds, group, ungroup, bringForward, sendBackward, alignLeft, alignCenterH, alignRight, alignTop, alignCenterV, alignBottom, distributeH, distributeV, contextMenu, runAIAction]);

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

      {/* Reconnecting banner */}
      {collabRoomId && collabStatus !== 'connected' && (
        <div className="absolute left-1/2 top-14 z-30 flex -translate-x-1/2 items-center gap-2 rounded-[14px] border border-amber-200/60 bg-amber-50/90 px-4 py-2 shadow-sm backdrop-blur-sm">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-xs font-medium text-amber-700">Reconnecting...</span>
        </div>
      )}

      {/* Logo — top left */}
      <div className="absolute left-4 top-4 z-10">
        <LogoPill href="/" onBeforeNavigate={isCollabMode ? undefined : flushSave} />
      </div>

      {/* Tool picker — center top */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <ToolPicker
          activeTool={activeTool}
          onToolChange={setTool}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={undo}
          onRedo={redo}
        />
        {activeTool === 'stamp' && (
          <div className="mt-2">
            <StampPanel
              selectedStamp={selectedStamp}
              onStampSelect={setSelectedStamp}
            />
          </div>
        )}
      </div>

      {/* Secondary actions — top right */}
      <div className="absolute right-4 top-4 z-10">
        <ActionGroup
          onExport={() => setExportOpen(true)}
          onShortcuts={() => setShortcutsOpen(true)}
          onSettings={() => {
            setSettingsHint(undefined);
            setSettingsOpen(true);
          }}
          onShare={() => setShareOpen(true)}
          isSharing={isCollaborating}
        />
      </div>

      {/* Share popover — anchored to top-right */}
      {shareOpen && (
        <div className="absolute right-4 top-16 z-20">
          <SharePopover onClose={() => setShareOpen(false)} />
        </div>
      )}

      {/* Collaborator Bar — top-right, below action group */}
      <div className="absolute right-4 top-16 z-10">
        <CollaboratorBar />
      </div>

      {/* Zoom — bottom left */}
      <div className="absolute bottom-4 left-4 z-10">
        <ZoomControls
          zoom={viewport.zoom}
          onZoomIn={() => zoomTo(viewport.zoom * 1.2)}
          onZoomOut={() => zoomTo(viewport.zoom / 1.2)}
        />
      </div>

      {/* Save indicator — bottom right (editor mode only) */}
      {!isCollabMode && (
        <div className="absolute bottom-4 right-4 z-10">
          <SaveIndicator status={saveStatus} onSave={flushSave} />
        </div>
      )}

      {/* Properties sidebar */}
      <PropertiesSidebar />

      {/* Alignment actions available via context menu and keyboard shortcuts */}

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
          selectionCount={selectedIds.size}
          elementCount={elements.length}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* AI Response Popovers — positioned in canvas space */}
      {aiPopovers.map((popover) => {
        const screenX = popover.x * viewport.zoom + viewport.panX;
        const screenY = popover.y * viewport.zoom + viewport.panY;
        return (
          <AIResponsePopover
            key={popover.id}
            id={popover.id}
            x={screenX}
            y={screenY}
            action={popover.action}
            text={popover.text}
            isLoading={popover.isLoading}
            error={popover.error}
            collapsed={popover.collapsed}
            isActive={popover.id === activePopoverId}
            onClose={handleClosePopover}
            onRetry={handleRetryPopover}
            onMove={handleMovePopover}
            onToggleCollapse={handleToggleCollapse}
            onActivate={handleActivatePopover}
          />
        );
      })}

      {/* Generate Diagram dialog */}
      <GenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onNeedsApiKey={() => {
          setSettingsHint('Enter your OpenRouter API key to use AI features.');
          setSettingsOpen(true);
        }}
      />

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        hint={settingsHint}
      />

      {/* Shortcuts Panel */}
      <ShortcutsPanel
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
};

export default CanvasEditor;
