import type { SerializedScene } from './scene';

export interface Project {
  id: string;
  name: string;
  scene: SerializedScene;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}
