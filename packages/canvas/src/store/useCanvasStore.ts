import { create } from 'zustand';
import type { Element, ToolType, Viewport } from '@flowbase/shared';
import { DEFAULT_VIEWPORT, generateId, DEFAULT_ELEMENT_PROPS, MAX_UNDO_STEPS } from '@flowbase/shared';

export interface CanvasState {
  // Elements
  elements: Element[];
  addElement: (element: Omit<Element, 'id' | 'zIndex'>) => string;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElements: (ids: string[]) => void;
  setElements: (elements: Element[]) => void;

  // History (undo/redo)
  history: Element[][];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Selection
  selectedIds: Set<string>;
  select: (ids: string[]) => void;
  addToSelection: (ids: string[]) => void;
  deselect: () => void;
  toggleSelection: (id: string) => void;

  // Tool
  activeTool: ToolType;
  setTool: (tool: ToolType) => void;

  // Viewport
  viewport: Viewport;
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomTo: (zoom: number, center?: { x: number; y: number }) => void;

  // Clipboard
  clipboard: Element[];
  copy: () => void;
  paste: (offset?: { x: number; y: number }) => void;

  // Z-order
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;

  // Grouping
  group: () => void;
  ungroup: () => void;

  // Snapping
  snapToGrid: boolean;
  snapToElements: boolean;
  toggleSnapToGrid: () => void;
  toggleSnapToElements: () => void;
  gridSize: number;

  // Drawing state
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  drawingElement: Element | null;
  setDrawingElement: (element: Element | null) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Elements
  elements: [],

  addElement: (elementData) => {
    const state = get();
    state.pushHistory();
    const id = generateId();
    const { elements } = state;
    const zIndex = elements.length > 0 ? Math.max(...elements.map((e) => e.zIndex)) + 1 : 0;
    const element: Element = {
      ...DEFAULT_ELEMENT_PROPS,
      ...elementData,
      id,
      zIndex,
    } as Element;
    set({ elements: [...elements, element] });
    return id;
  },

  updateElement: (id, updates) => {
    set({
      elements: get().elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    });
  },

  deleteElements: (ids) => {
    const state = get();
    state.pushHistory();
    const idSet = new Set(ids);
    set({
      elements: state.elements.filter((el) => !idSet.has(el.id)),
      selectedIds: new Set(),
    });
  },

  setElements: (elements) => set({ elements }),

  // History (snapshot-based undo/redo)
  history: [[]],
  historyIndex: 0,

  pushHistory: () => {
    const { elements, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(elements.map((el) => ({ ...el })));
    if (newHistory.length > MAX_UNDO_STEPS) {
      newHistory.shift();
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex, elements } = get();
    if (historyIndex <= 0) return;
    // Save current state if we're at the tip
    if (historyIndex === history.length - 1) {
      const newHistory = [...history];
      if (historyIndex === newHistory.length - 1) {
        newHistory.push(elements.map((el) => ({ ...el })));
        set({ history: newHistory });
      }
    }
    const newIndex = historyIndex - 1;
    set({
      elements: get().history[newIndex].map((el) => ({ ...el })),
      historyIndex: newIndex,
      selectedIds: new Set(),
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({
      elements: history[newIndex].map((el) => ({ ...el })),
      historyIndex: newIndex,
      selectedIds: new Set(),
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // Selection
  selectedIds: new Set<string>(),

  select: (ids) => set({ selectedIds: new Set(ids) }),

  addToSelection: (ids) => {
    const current = get().selectedIds;
    const next = new Set(current);
    ids.forEach((id) => next.add(id));
    set({ selectedIds: next });
  },

  deselect: () => set({ selectedIds: new Set() }),

  toggleSelection: (id) => {
    const current = get().selectedIds;
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedIds: next });
  },

  // Tool
  activeTool: 'select',
  setTool: (tool) => set({ activeTool: tool, selectedIds: new Set() }),

  // Viewport
  viewport: { ...DEFAULT_VIEWPORT },

  setViewport: (updates) => {
    set({ viewport: { ...get().viewport, ...updates } });
  },

  zoomTo: (zoom, center) => {
    const { viewport } = get();
    const clampedZoom = Math.min(5, Math.max(0.1, zoom));
    if (center) {
      const scale = clampedZoom / viewport.zoom;
      set({
        viewport: {
          zoom: clampedZoom,
          panX: center.x - (center.x - viewport.panX) * scale,
          panY: center.y - (center.y - viewport.panY) * scale,
        },
      });
    } else {
      set({ viewport: { ...viewport, zoom: clampedZoom } });
    }
  },

  // Clipboard
  clipboard: [],

  copy: () => {
    const { elements, selectedIds } = get();
    const copied = elements.filter((el) => selectedIds.has(el.id));
    set({ clipboard: copied });
  },

  paste: (offset = { x: 20, y: 20 }) => {
    const state = get();
    const { clipboard, elements } = state;
    if (clipboard.length === 0) return;
    state.pushHistory();
    const maxZ = elements.length > 0 ? Math.max(...elements.map((e) => e.zIndex)) : -1;
    const newElements = clipboard.map((el, i) => ({
      ...el,
      id: generateId(),
      x: el.x + offset.x,
      y: el.y + offset.y,
      zIndex: maxZ + 1 + i,
    }));
    const newIds = newElements.map((el) => el.id);
    set({
      elements: [...get().elements, ...newElements],
      selectedIds: new Set(newIds),
    });
  },

  // Z-order
  bringForward: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const newElements = [...sorted];
    for (let i = newElements.length - 2; i >= 0; i--) {
      if (selectedIds.has(newElements[i].id) && !selectedIds.has(newElements[i + 1].id)) {
        const temp = newElements[i].zIndex;
        newElements[i] = { ...newElements[i], zIndex: newElements[i + 1].zIndex };
        newElements[i + 1] = { ...newElements[i + 1], zIndex: temp };
        [newElements[i], newElements[i + 1]] = [newElements[i + 1], newElements[i]];
      }
    }
    set({ elements: newElements });
  },

  sendBackward: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const newElements = [...sorted];
    for (let i = 1; i < newElements.length; i++) {
      if (selectedIds.has(newElements[i].id) && !selectedIds.has(newElements[i - 1].id)) {
        const temp = newElements[i].zIndex;
        newElements[i] = { ...newElements[i], zIndex: newElements[i - 1].zIndex };
        newElements[i - 1] = { ...newElements[i - 1], zIndex: temp };
        [newElements[i], newElements[i - 1]] = [newElements[i - 1], newElements[i]];
      }
    }
    set({ elements: newElements });
  },

  bringToFront: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    const maxZ = Math.max(...elements.map((e) => e.zIndex));
    let nextZ = maxZ + 1;
    set({
      elements: elements.map((el) =>
        selectedIds.has(el.id) ? { ...el, zIndex: nextZ++ } : el,
      ),
    });
  },

  sendToBack: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    get().pushHistory();
    const minZ = Math.min(...elements.map((e) => e.zIndex));
    let nextZ = minZ - selectedIds.size;
    set({
      elements: elements.map((el) =>
        selectedIds.has(el.id) ? { ...el, zIndex: nextZ++ } : el,
      ),
    });
  },

  // Grouping
  group: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size < 2) return;
    get().pushHistory();
    const groupId = generateId();
    set({
      elements: elements.map((el) =>
        selectedIds.has(el.id) ? { ...el, groupId } : el,
      ),
    });
  },

  ungroup: () => {
    const { elements, selectedIds } = get();
    if (selectedIds.size === 0) return;
    // Find all groupIds of selected elements
    const groupIds = new Set<string>();
    elements.forEach((el) => {
      if (selectedIds.has(el.id) && el.groupId) {
        groupIds.add(el.groupId);
      }
    });
    if (groupIds.size === 0) return;
    get().pushHistory();
    set({
      elements: elements.map((el) =>
        el.groupId && groupIds.has(el.groupId) ? { ...el, groupId: undefined } : el,
      ),
    });
  },

  // Snapping
  snapToGrid: true,
  snapToElements: true,
  toggleSnapToGrid: () => set({ snapToGrid: !get().snapToGrid }),
  toggleSnapToElements: () => set({ snapToElements: !get().snapToElements }),
  gridSize: 24,

  // Drawing state
  isDrawing: false,
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  drawingElement: null,
  setDrawingElement: (element) => set({ drawingElement: element }),
}));
