'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FlowbaseCanvas, useCanvasStore, recalcBoundArrow, getAnchorPoints, useCollaboration } from '@flowbase/canvas';
import type Konva from 'konva';
import type { ToolType, AIActionType, AnchorPosition, Binding } from '@flowbase/shared';
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
import GenerateDialog from '../ai/GenerateDialog';
import { parseLayoutResponse } from '@flowbase/ai';
import type { LayoutPreviewPosition } from '@flowbase/canvas';
import LayoutPreview from '../ai/LayoutPreview';
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
}

const CanvasEditor = ({ projectId, projectName }: CanvasEditorProps) => {
  const isCollabMode = !projectId;
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsHint, setSettingsHint] = useState<string | undefined>();
  const [aiPopovers, setAiPopovers] = useState<AIPopoverInstance[]>([]);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const [layoutPreview, setLayoutPreview] = useState<LayoutPreviewPosition[] | null>(null);
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const layoutAbortController = useRef<AbortController | null>(null);
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
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const setElements = useCanvasStore((s) => s.setElements);

  const { isCollaborating, status: collabStatus, roomId: collabRoomId } = useCollaboration();

  const { status: saveStatus, flushSave } = useAutoSave(projectId ?? '', stageRef, !isCollabMode);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);

  // Cancel layout loading on Escape
  useEffect(() => {
    if (!isLayoutLoading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (layoutAbortController.current) {
          layoutAbortController.current.abort();
          layoutAbortController.current = null;
        }
        setIsLayoutLoading(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutLoading]);

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
      const instance: AIPopoverInstance = {
        id: popoverId,
        x: menuX,
        y: menuY + 8,
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

  const runLayoutAction = useCallback(async () => {
    setLayoutPreview(null);
    setIsLayoutLoading(true);

    const { apiKey, model } = getAISettings();
    if (!apiKey) {
      setSettingsHint('Enter your OpenRouter API key to use AI features.');
      setSettingsOpen(true);
      setIsLayoutLoading(false);
      return;
    }

    const controller = new AbortController();
    layoutAbortController.current = controller;

    try {
      const scene = { version: 1, elements };
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ action: 'layout', scene, model }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let sseBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'string') {
              fullText += parsed;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected') throw e;
          }
        }
      }

      const existingIds = elements.map((el) => el.id);
      const result = parseLayoutResponse(fullText, existingIds);

      if (result.positions.length === 0) {
        throw new Error('AI could not generate layout suggestions. Try again.');
      }

      setLayoutPreview(result.positions);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const errorMsg = e instanceof Error ? e.message : 'Layout failed';
      alert(errorMsg);
    } finally {
      setIsLayoutLoading(false);
      layoutAbortController.current = null;
    }
  }, [elements]);

  const handleApplyLayout = useCallback(() => {
    if (!layoutPreview) return;

    const posMap = new Map(layoutPreview.map((p) => [p.id, { x: p.x, y: p.y }]));

    const startPositions = new Map<string, { x: number; y: number }>();
    for (const el of elements) {
      if (posMap.has(el.id)) {
        startPositions.set(el.id, { x: el.x, y: el.y });
      }
    }

    // Build a snapshot of elements at their final target positions for anchor calculation
    const finalElements = elements.map((el) => {
      const target = posMap.get(el.id);
      return target ? { ...el, x: target.x, y: target.y } : el;
    });

    // Recompute optimal anchor bindings based on final positions
    // For each bound arrow, find the closest anchor pair between source and target shapes
    const updatedBindings = new Map<string, { startBinding?: Binding; endBinding?: Binding }>();
    for (const el of elements) {
      if ((el.type !== 'arrow' && el.type !== 'line') || (!el.startBinding && !el.endBinding)) continue;

      const sb = el.startBinding;
      const eb = el.endBinding;

      if (sb && eb) {
        const sourceEl = finalElements.find((e) => e.id === sb.elementId);
        const targetEl = finalElements.find((e) => e.id === eb.elementId);

        if (sourceEl && targetEl) {
          const sourceAnchors = getAnchorPoints(sourceEl);
          const targetAnchors = getAnchorPoints(targetEl);

          let bestDist = Infinity;
          let bestSource = sourceAnchors[0];
          let bestTarget = targetAnchors[0];

          for (const sa of sourceAnchors) {
            for (const ta of targetAnchors) {
              const dist = Math.hypot(sa.x - ta.x, sa.y - ta.y);
              if (dist < bestDist) {
                bestDist = dist;
                bestSource = sa;
                bestTarget = ta;
              }
            }
          }

          updatedBindings.set(el.id, {
            startBinding: { elementId: sb.elementId, anchor: bestSource.anchor },
            endBinding: { elementId: eb.elementId, anchor: bestTarget.anchor },
          });
        }
      }
    }

    setLayoutPreview(null);
    pushHistory();
    setIsAnimating(true);

    const duration = 300;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      // Update shape positions and arrow bindings
      let updated = elements.map((el) => {
        const bindingUpdate = updatedBindings.get(el.id);
        const withBindings = bindingUpdate ? { ...el, ...bindingUpdate } : el;

        const start = startPositions.get(el.id);
        const target = posMap.get(el.id);
        if (!start || !target) return withBindings;

        return {
          ...withBindings,
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
        };
      });

      // Recalculate bound arrow positions to follow their connected shapes
      updated = updated.map((el) => {
        if ((el.type !== 'arrow' && el.type !== 'line') || (!el.startBinding && !el.endBinding)) return el;
        const arrowUpdates = recalcBoundArrow(el, updated);
        if (!arrowUpdates) return el;
        return { ...el, ...arrowUpdates };
      });

      setElements(updated);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [layoutPreview, elements, pushHistory, setElements]);

  const handleCancelLayout = useCallback(() => {
    setLayoutPreview(null);
    if (layoutAbortController.current) {
      layoutAbortController.current.abort();
      layoutAbortController.current = null;
    }
  }, []);

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

  const handleMovePopover = useCallback((id: string, x: number, y: number) => {
    setAiPopovers((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
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
      case 'layout':
        runLayoutAction();
        break;
      case 'explain':
      case 'suggest':
      case 'summarize':
        if (contextMenu) {
          runAIAction(action, contextMenu.x, contextMenu.y);
        }
        break;
    }
  }, [copy, paste, deleteElements, selectedIds, group, ungroup, bringForward, sendBackward, alignLeft, alignCenterH, alignRight, alignTop, alignCenterV, alignBottom, distributeH, distributeV, contextMenu, runAIAction, runLayoutAction]);

  if (dimensions.width === 0) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white" style={isAnimating ? { pointerEvents: 'none' } : undefined}>
      {/* Canvas */}
      <FlowbaseCanvas
        width={dimensions.width}
        height={dimensions.height}
        stageRef={stageRef}
        onContextMenu={handleContextMenu}
        layoutPreview={layoutPreview}
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

      {/* AI Response Popovers */}
      {aiPopovers.map((popover) => (
        <AIResponsePopover
          key={popover.id}
          id={popover.id}
          x={popover.x}
          y={popover.y}
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
      ))}

      {/* Layout loading indicator */}
      {isLayoutLoading && (
        <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[14px] border border-black/[0.06] bg-white/90 px-5 py-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
          <span className="text-[13px] font-medium text-[#52525b]">Analyzing layout…</span>
        </div>
      )}

      {/* Layout preview controls */}
      {layoutPreview && (
        <LayoutPreview onApply={handleApplyLayout} onCancel={handleCancelLayout} />
      )}

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
