import { create } from 'zustand';
import type { Element, ToolType, Viewport } from '@flowbase/shared';
import { DEFAULT_VIEWPORT, generateId, DEFAULT_ELEMENT_PROPS } from '@flowbase/shared';

export interface CanvasState {
  // Elements
  elements: Element[];
  addElement: (element: Omit<Element, 'id' | 'zIndex'>) => string;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElements: (ids: string[]) => void;
  setElements: (elements: Element[]) => void;

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
    const id = generateId();
    const { elements } = get();
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
    const idSet = new Set(ids);
    set({
      elements: get().elements.filter((el) => !idSet.has(el.id)),
      selectedIds: new Set(),
    });
  },

  setElements: (elements) => set({ elements }),

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
    const { clipboard, elements } = get();
    if (clipboard.length === 0) return;
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
      elements: [...elements, ...newElements],
      selectedIds: new Set(newIds),
    });
  },

  // Drawing state
  isDrawing: false,
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  drawingElement: null,
  setDrawingElement: (element) => set({ drawingElement: element }),
}));
