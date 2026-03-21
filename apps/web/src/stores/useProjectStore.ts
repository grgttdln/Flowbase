import { create } from 'zustand';
import type { Project } from '@flowbase/shared';
import { generateId } from '@flowbase/shared';
import {
  listActiveProjects,
  listDeletedProjects,
  saveProject,
  softDeleteProject,
  restoreProject,
  permanentlyDeleteProject,
  purgeExpiredProjects,
} from '@/lib/db';

interface ProjectStore {
  projects: Project[];
  deleted: Project[];
  loading: boolean;

  loadProjects: () => Promise<void>;
  createProject: () => Promise<string>;
  renameProject: (id: string, name: string) => Promise<void>;
  softDelete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  deleted: [],
  loading: true,

  loadProjects: async () => {
    set({ loading: true });
    await purgeExpiredProjects();
    const [projects, deleted] = await Promise.all([
      listActiveProjects(),
      listDeletedProjects(),
    ]);
    set({ projects, deleted, loading: false });
  },

  createProject: async () => {
    const id = generateId();
    const now = Date.now();
    const project: Project = {
      id,
      name: 'Untitled',
      scene: { version: 1, elements: [] },
      thumbnail: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await saveProject(project);
    set({ projects: [project, ...get().projects] });
    return id;
  },

  renameProject: async (id, name) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const updated = { ...project, name, updatedAt: Date.now() };
    await saveProject(updated);
    set({
      projects: projects.map((p) => (p.id === id ? updated : p)),
    });
  },

  softDelete: async (id) => {
    await softDeleteProject(id);
    const { projects } = get();
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const deleted = { ...project, deletedAt: Date.now() };
    set({
      projects: projects.filter((p) => p.id !== id),
      deleted: [deleted, ...get().deleted],
    });
  },

  restore: async (id) => {
    await restoreProject(id);
    const { deleted } = get();
    const project = deleted.find((p) => p.id === id);
    if (!project) return;
    const restored = { ...project, deletedAt: null };
    set({
      deleted: deleted.filter((p) => p.id !== id),
      projects: [restored, ...get().projects],
    });
  },

  permanentlyDelete: async (id) => {
    await permanentlyDeleteProject(id);
    set({
      deleted: get().deleted.filter((p) => p.id !== id),
    });
  },
}));
