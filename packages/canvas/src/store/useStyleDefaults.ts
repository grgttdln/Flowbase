import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CategoryDefaults {
  stroke: string;
  fill: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
}

interface StyleDefaultsState {
  shapes: CategoryDefaults;
  lines: CategoryDefaults;
  text: CategoryDefaults;
  update: (category: 'shapes' | 'lines' | 'text', updates: Partial<CategoryDefaults>) => void;
}

const SHAPE_DEFAULTS: CategoryDefaults = {
  stroke: '#007AFF',
  fill: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
};

const LINE_DEFAULTS: CategoryDefaults = {
  stroke: '#007AFF',
  fill: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
};

const TEXT_DEFAULTS: CategoryDefaults = {
  stroke: '#1C1C1E',
  fill: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
};

export type ToolCategory = 'shapes' | 'lines' | 'text';

export function getToolCategory(toolOrType: string): ToolCategory | null {
  switch (toolOrType) {
    case 'rectangle':
    case 'ellipse':
    case 'diamond':
      return 'shapes';
    case 'line':
    case 'arrow':
    case 'freehand':
      return 'lines';
    case 'text':
      return 'text';
    default:
      return null;
  }
}

export const useStyleDefaults = create<StyleDefaultsState>()(
  persist(
    (set, get) => ({
      shapes: { ...SHAPE_DEFAULTS },
      lines: { ...LINE_DEFAULTS },
      text: { ...TEXT_DEFAULTS },
      update: (category, updates) => {
        set({ [category]: { ...get()[category], ...updates } });
      },
    }),
    {
      name: 'flowbase:style-defaults',
    },
  ),
);
