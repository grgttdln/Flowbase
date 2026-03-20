import type { SerializedScene } from './scene';

export type AIActionType = 'explain' | 'suggest' | 'summarize';

export interface AIModel {
  id: string;
  name: string;
  supportsVision: boolean;
}

export interface AIRequest {
  action: AIActionType;
  scene: SerializedScene;
  selectedIds?: string[];
  apiKey: string;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  analyze(request: AIRequest): AsyncIterable<string>;
  testConnection(apiKey: string): Promise<boolean>;
}
