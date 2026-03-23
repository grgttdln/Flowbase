import type { SerializedScene } from './scene';

export type AIActionType = 'explain' | 'suggest' | 'summarize' | 'generate' | 'layout';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  action: AIActionType;
  scene: SerializedScene;
  selectedIds?: string[];
}
