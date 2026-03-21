import { openDB as idbOpen, type IDBPDatabase } from 'idb';
import type { Project } from '@flowbase/shared';

const DB_NAME = 'flowbase-db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const PURGE_DAYS = 30;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = idbOpen(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
        store.createIndex('deletedAt', 'deletedAt');
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, project);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function listActiveProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all
    .filter((p: Project) => p.deletedAt === null)
    .sort((a: Project, b: Project) => b.updatedAt - a.updatedAt);
}

export async function listDeletedProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all
    .filter((p: Project) => p.deletedAt !== null)
    .sort((a: Project, b: Project) => b.updatedAt - a.updatedAt);
}

export async function softDeleteProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get(STORE_NAME, id);
  if (project) {
    project.deletedAt = Date.now();
    await db.put(STORE_NAME, project);
  }
}

export async function restoreProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get(STORE_NAME, id);
  if (project) {
    project.deletedAt = null;
    await db.put(STORE_NAME, project);
  }
}

export async function permanentlyDeleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function purgeExpiredProjects(): Promise<void> {
  const db = await getDB();
  const cutoff = Date.now() - PURGE_DAYS * 24 * 60 * 60 * 1000;
  const all = await db.getAll(STORE_NAME);
  const expired = all.filter(
    (p: Project) => p.deletedAt !== null && p.deletedAt < cutoff,
  );
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all([
    ...expired.map((p: Project) => tx.store.delete(p.id)),
    tx.done,
  ]);
}
