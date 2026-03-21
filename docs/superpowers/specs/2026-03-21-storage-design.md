# Phase 5: Storage & Project Management — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Depends on:** Phase 2 (Canvas Foundation)

## Overview

Client-side storage and project management for Flowbase. All data lives in the browser via IndexedDB. Projects auto-save, persist across sessions, and can be exported/imported as `.flowbase` JSON or PNG.

## Decisions

- Pure IndexedDB — no sync abstraction, no backend
- Route-based navigation: `/` (home) ↔ `/editor/[id]` (editor)
- JSON + PNG export only — SVG deferred to a later phase
- Forward-compatible `.flowbase` import with schema validation
- Auto-save (1s debounce) + manual save button in toolbar
- Soft delete with "Recently Deleted" section, 30-day auto-purge

## Data Model

### IndexedDB Schema

**Database:** `flowbase-db`, version 1

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| `projects` | `id` | `updatedAt`, `deletedAt` | All project data |

### ProjectRecord

```typescript
interface ProjectRecord {
  id: string;                  // nanoid
  name: string;                // user-editable
  scene: SerializedScene;      // { version: number, elements: Element[] }
  thumbnail: string;           // base64 data URL from Konva toDataURL()
  createdAt: number;           // Date.now() on creation
  updatedAt: number;           // Date.now() on every save
  deletedAt: number | null;    // null = active, timestamp = soft-deleted
}
```

Single object store — scene data stored inline to keep reads/writes atomic. Thumbnails stored as base64 inline (~10-30KB each).

### db.ts Exports

Plain async functions using `idb`:

- `openDB()` — singleton DB connection
- `saveProject(project: ProjectRecord)` — put
- `getProject(id: string)` — get by key
- `listActiveProjects()` — all where `deletedAt === null`, sorted by `updatedAt` desc
- `listDeletedProjects()` — all where `deletedAt !== null`
- `softDeleteProject(id: string)` — set `deletedAt` to now
- `restoreProject(id: string)` — set `deletedAt` back to null
- `permanentlyDeleteProject(id: string)` — delete record
- `purgeExpiredProjects()` — delete records where `deletedAt` is older than 30 days

## Auto-Save

### useAutoSave Hook

**Location:** `apps/web/src/hooks/useAutoSave.ts`

- Subscribes to `useCanvasStore` via Zustand's `subscribe` — watches `elements` only (not viewport, selection, or tool state)
- Debounces saves at 1 second (`AUTO_SAVE_DEBOUNCE_MS` from shared constants)
- On each save:
  1. Serialize current elements into `SerializedScene`
  2. Generate thumbnail via Konva stage ref `toDataURL({ pixelRatio: 0.5 })`
  3. Call `saveProject()` with updated scene, thumbnail, and `updatedAt`
- Exposes state: `'saved' | 'saving' | 'error'`
- Takes `projectId` param and a Konva stage ref
- Flushes pending save on unmount

### Manual Save

`SaveIndicator` component becomes clickable. On click, flushes the debounce timer and triggers an immediate save.

## Project Loading

In `/editor/[id]/page.tsx`:

1. Read `id` from route params
2. Call `getProject(id)` from `db.ts`
3. If not found or soft-deleted → redirect to `/`
4. Call `useCanvasStore.getState().setElements(project.scene.elements)` to hydrate the canvas
5. Mount `useAutoSave(id, stageRef)`
6. On unmount, flush any pending save

Viewport state is not persisted — each project opens at default zoom/pan.

## Project Store

### useProjectStore

**Location:** `apps/web/src/stores/useProjectStore.ts`

Zustand store for the home screen. Reads from IndexedDB on mount, not persisted itself.

```
State:
  projects: ProjectRecord[]       // active projects
  deleted: ProjectRecord[]        // recently deleted
  loading: boolean

Actions:
  loadProjects()                  // fetch both lists from db, run purgeExpiredProjects()
  createProject(name: string)     // create record in db, navigate to /editor/[id]
  renameProject(id, name)         // update name in db + local state
  softDelete(id)                  // move to deleted list
  restore(id)                     // move back to active list
  permanentlyDelete(id)           // remove from deleted list + db
```

## Home Screen

### Layout

Compact list design:

- **Header:** "Your Projects" title + "+ New Project" button (system blue)
- **Project list:** Rows with small thumbnail (48x36), project name, relative timestamp, `···` action menu
- **Action menu:** Rename, Delete (soft)
- **"Recently Deleted" section:** Collapsed at bottom, expandable. Shows trashed projects with Restore / Delete Forever actions
- **Empty state:** Friendly message + "Create your first project" CTA
- **Click a row** → navigate to `/editor/[id]`

### Components

- `ProjectList.tsx` — list container, calls `loadProjects()` on mount
- `ProjectRow.tsx` — single row with thumbnail, name, time, action menu
- `DeletedSection.tsx` — collapsible recently deleted area
- `EmptyState.tsx` — zero-projects state

All in `apps/web/src/components/home/`.

## New Project Flow

1. User clicks "+ New Project"
2. `createProject()` generates `id` via `nanoid()`
3. Creates record: `{ id, name: "Untitled", scene: { version: 1, elements: [] }, thumbnail: "", createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null }`
4. Saves to IndexedDB
5. Navigates to `/editor/[id]` via `router.push()`

### Renaming

- **Home screen:** `···` → Rename → inline edit on the row (Enter to confirm, Escape to cancel)
- **Editor:** Project name in toolbar, click-to-edit inline

### Navigation

- `LogoPill` in toolbar links back to `/`
- Flush pending auto-save before navigation

## Export

**Location:** `apps/web/src/lib/export.ts`

### .flowbase JSON

- Serializes as `{ version: 1, name, scene, exportedAt }`
- Browser download via `URL.createObjectURL` + hidden anchor click
- File named `{project-name}.flowbase`

### PNG

- Konva stage ref `toDataURL({ pixelRatio: 2 })` for 2x resolution
- Exports full canvas content (all elements), not just visible viewport
- File named `{project-name}.png`

### Export Dialog

`apps/web/src/components/dialogs/ExportDialog.tsx`

- Modal triggered from toolbar export button
- Two options: "Flowbase Project (.flowbase)" and "Image (.png)"
- Click option → triggers download → closes dialog

## Import

**Location:** `apps/web/src/lib/import.ts`

### Entry Points

- File picker button on home screen
- Drag-and-drop on home screen

### Flow

1. Read file as text, parse JSON
2. Validate with `validateScene()` — check `version` exists, `scene.elements` is array, each element has required fields (`id`, `type`, `x`, `y`, `width`, `height`)
3. If version is newer than known → warn but still attempt load
4. Strip unknown fields, apply defaults for missing optional fields
5. Create new project record → navigate to `/editor/[id]`

### Validation

**Location:** `packages/shared/src/validation/project.ts`

- `validateScene(data: unknown): { valid: boolean; errors: string[] }`
- Hand-written runtime checks — no validation library needed for this schema size

## File Map

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/db.ts` | IndexedDB setup + CRUD functions |
| `apps/web/src/lib/export.ts` | JSON + PNG export logic |
| `apps/web/src/lib/import.ts` | File import + validation |
| `apps/web/src/stores/useProjectStore.ts` | Home screen project state |
| `apps/web/src/hooks/useAutoSave.ts` | Debounced auto-save hook |
| `packages/shared/src/validation/project.ts` | Runtime scene validation |
| `apps/web/src/components/home/ProjectList.tsx` | Project list container |
| `apps/web/src/components/home/ProjectRow.tsx` | Single project row |
| `apps/web/src/components/home/DeletedSection.tsx` | Recently deleted section |
| `apps/web/src/components/home/EmptyState.tsx` | No-projects state |
| `apps/web/src/components/dialogs/ExportDialog.tsx` | Format picker modal |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/src/app/page.tsx` | Replace stub with home screen |
| `apps/web/src/app/editor/[id]/page.tsx` | Add project loading + auto-save |
| `apps/web/src/components/toolbar/SaveIndicator.tsx` | Make clickable for manual save |
| `apps/web/src/components/toolbar/LogoPill.tsx` | Link back to home |
| `apps/web/src/components/toolbar/ActionGroup.tsx` | Wire export button to dialog |
| `packages/shared/src/types/project.ts` | Add `deletedAt` field to Project |

### New Dependencies

Added to `apps/web/package.json`:
- `idb` — IndexedDB wrapper
- `nanoid` — ID generation

### No Changes To

The `packages/canvas` package — storage is entirely in the web app layer.

## Exit Criteria

- Projects auto-save and persist across browser sessions
- Home screen shows all projects in compact list with thumbnails
- Export works for JSON and PNG
- Import validates and loads `.flowbase` files
- Soft-deleted projects recoverable for 30 days
