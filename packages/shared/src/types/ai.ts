import type { SerializedScene } from './scene';

export type AIActionType = 'explain' | 'suggest' | 'summarize' | 'generate';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  action: AIActionType;
  scene: SerializedScene;
  selectedIds?: string[];
}

/** Persistable AI popover data (excludes runtime fields like isLoading/error). */
export interface SavedAIPopover {
  id: string;
  x: number;
  y: number;
  action: AIActionType;
  text: string;
  collapsed: boolean;
  selectedIds?: string[];
}
