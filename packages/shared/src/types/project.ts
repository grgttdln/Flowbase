import type { SerializedScene } from './scene';
import type { SavedAIPopover } from './ai';

export interface Project {
  id: string;
  name: string;
  scene: SerializedScene;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  aiPopovers?: SavedAIPopover[];
}
