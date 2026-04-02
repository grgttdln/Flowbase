# Phase 5: Polish & Edge Cases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Handle real-world collaboration scenarios — reconnection UI, tab sleep recovery, viewport culling, selection debounce, and graceful degradation when the collab server is unavailable.

**Architecture:** Most work is small targeted changes to existing files. The reconnecting banner is a new component in CanvasEditor. Tab focus reconnect uses a `visibilitychange` listener in CollaborationProvider. Viewport culling filters remote cursors by visible canvas area. Graceful degradation adds a server health check before showing the Share button.

**Tech Stack:** React, Konva, Zustand, y-websocket (built-in reconnection), Tailwind CSS

---

## File Structure

```
packages/canvas/src/collaboration/
├── CollaborationProvider.tsx    # MODIFY — tab focus reconnect trigger
├── usePresence.ts              # MODIFY — wire selection debounce
├── RemoteCursors.tsx           # MODIFY — viewport culling

packages/canvas/src/components/
├── FlowbaseCanvas.tsx          # MODIFY — always-render presence layer, pass viewport

apps/web/src/components/
├── canvas/CanvasEditor.tsx     # MODIFY — reconnecting banner
├── dialogs/SharePopover.tsx    # MODIFY — server health check, unavailable state
```

---

### Task 1: Reconnecting banner and always-render presence layer

**Files:**
- Modify: `apps/web/src/components/canvas/CanvasEditor.tsx`
- Modify: `packages/canvas/src/components/FlowbaseCanvas.tsx`

- [ ] **Step 1: Add reconnecting banner to CanvasEditor**

In `apps/web/src/components/canvas/CanvasEditor.tsx`, the `isCollaborating` and collaboration hook are already imported. We need the full `status` from the context.

Change the existing hook call:
```typescript
const { isCollaborating } = useCollaboration();
```
To:
```typescript
const { isCollaborating, status: collabStatus } = useCollaboration();
```

Add a reconnecting banner in the JSX, right after the `<FlowbaseCanvas>` component (before the Logo pill):

```tsx
{/* Reconnecting banner */}
{isCollaborating === false && collabStatus === 'disconnected' && !isCollabMode && (
  <div className="absolute left-1/2 top-14 z-30 flex -translate-x-1/2 items-center gap-2 rounded-[14px] border border-amber-200/60 bg-amber-50/90 px-4 py-2 shadow-sm backdrop-blur-sm">
    <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
    <span className="text-xs font-medium text-amber-700">Reconnecting...</span>
  </div>
)}
```

Wait — `isCollaborating` is derived from `status === 'connected'` in the provider, so when disconnected during an active session it will be `false`. But we need to distinguish "was collaborating and lost connection" from "never started collaborating". The simplest check: if `collabStatus === 'disconnected'` AND there IS a `roomId`, show the banner.

Change the hook call:
```typescript
const { isCollaborating, status: collabStatus, roomId: collabRoomId } = useCollaboration();
```

And the banner condition:
```tsx
{/* Reconnecting banner — shown when actively collaborating but connection dropped */}
{collabRoomId && collabStatus !== 'connected' && collabStatus !== 'disconnected' && (
  <div className="absolute left-1/2 top-14 z-30 flex -translate-x-1/2 items-center gap-2 rounded-[14px] border border-amber-200/60 bg-amber-50/90 px-4 py-2 shadow-sm backdrop-blur-sm">
    <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
    <span className="text-xs font-medium text-amber-700">Reconnecting...</span>
  </div>
)}
```

Actually, let me simplify. The y-websocket provider cycles through `connecting` → `connected` → `disconnected` → `connecting` during reconnection. We want to show the banner when:
- There's an active room (`collabRoomId` is set)
- Status is NOT `connected`

```tsx
{/* Reconnecting banner */}
{collabRoomId && collabStatus !== 'connected' && (
  <div className="absolute left-1/2 top-14 z-30 flex -translate-x-1/2 items-center gap-2 rounded-[14px] border border-amber-200/60 bg-amber-50/90 px-4 py-2 shadow-sm backdrop-blur-sm">
    <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
    <span className="text-xs font-medium text-amber-700">Reconnecting...</span>
  </div>
)}
```

- [ ] **Step 2: Always render presence layer when awareness exists**

In `packages/canvas/src/components/FlowbaseCanvas.tsx`, change the presence layer conditional from:

```tsx
{remoteUsers.length > 0 && (
  <Layer listening={false}>
    <RemoteSelections remoteUsers={remoteUsers} elements={elements} />
    <RemoteCursors remoteUsers={remoteUsers} />
  </Layer>
)}
```

To:

```tsx
{awareness && (
  <Layer listening={false}>
    <RemoteSelections remoteUsers={remoteUsers} elements={elements} />
    <RemoteCursors remoteUsers={remoteUsers} />
  </Layer>
)}
```

This prevents Konva layer mount/unmount churn when users come and go. The child components already return `null` when there are no remote users.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/canvas/CanvasEditor.tsx packages/canvas/src/components/FlowbaseCanvas.tsx
git commit -m "feat(web): add reconnecting banner and stabilize presence layer"
```

---

### Task 2: Tab focus reconnect trigger

**Files:**
- Modify: `packages/canvas/src/collaboration/CollaborationProvider.tsx`

- [ ] **Step 1: Add visibilitychange listener**

In `packages/canvas/src/collaboration/CollaborationProvider.tsx`, add a new `useEffect` after the existing auto-start effect (the one that calls `startCollaboration` when `initialRoomId` is provided). This effect listens for tab focus and pings the connection:

```typescript
// Reconnect on tab focus (browsers throttle background tabs)
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && providerRef.current) {
      // If the provider exists but isn't connected, nudge it to reconnect
      if (!providerRef.current.wsconnected) {
        providerRef.current.connect()
      }
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

The `WebsocketProvider.connect()` method initiates a connection attempt. If already connecting, it's a no-op. If the WebSocket was disconnected during background throttling, this forces an immediate reconnect rather than waiting for the next backoff interval.

- [ ] **Step 2: Commit**

```bash
git add packages/canvas/src/collaboration/CollaborationProvider.tsx
git commit -m "feat(canvas): reconnect WebSocket on tab focus"
```

---

### Task 3: Viewport culling for remote cursors

**Files:**
- Modify: `packages/canvas/src/collaboration/RemoteCursors.tsx`
- Modify: `packages/canvas/src/components/FlowbaseCanvas.tsx`

- [ ] **Step 1: Add viewport prop to RemoteCursors**

In `packages/canvas/src/collaboration/RemoteCursors.tsx`, add an optional `viewport` prop for culling:

Change the `RemoteCursorsProps` interface:
```typescript
interface RemoteCursorsProps {
  remoteUsers: RemoteUser[]
  viewport?: { x: number; y: number; zoom: number; width: number; height: number }
}
```

Update the `RemoteCursors` component to filter by viewport:
```typescript
const RemoteCursors = memo(({ remoteUsers, viewport }: RemoteCursorsProps) => {
  const usersWithCursors = remoteUsers.filter((u) => {
    if (!u.cursor) return false
    if (!viewport) return true
    // Check if cursor is within the visible canvas area
    const viewLeft = -viewport.x / viewport.zoom
    const viewTop = -viewport.y / viewport.zoom
    const viewRight = viewLeft + viewport.width / viewport.zoom
    const viewBottom = viewTop + viewport.height / viewport.zoom
    // Add generous padding (200px in canvas space) so cursors near edges don't pop in/out
    const pad = 200
    return (
      u.cursor.x >= viewLeft - pad &&
      u.cursor.x <= viewRight + pad &&
      u.cursor.y >= viewTop - pad &&
      u.cursor.y <= viewBottom + pad
    )
  })

  if (usersWithCursors.length === 0) return null

  return (
    <>
      {usersWithCursors.map((user) => (
        <RemoteCursor key={user.clientId} user={user} />
      ))}
    </>
  )
})
```

- [ ] **Step 2: Pass viewport from FlowbaseCanvas**

In `packages/canvas/src/components/FlowbaseCanvas.tsx`, the component already has `viewport` from Zustand. Pass it to RemoteCursors along with the canvas dimensions (which come from props `width` and `height`):

Change:
```tsx
<RemoteCursors remoteUsers={remoteUsers} />
```

To:
```tsx
<RemoteCursors
  remoteUsers={remoteUsers}
  viewport={{ ...viewport, width, height }}
/>
```

The `viewport` from Zustand has `{ x, y, zoom }`. We add `width` and `height` from the FlowbaseCanvas props to give RemoteCursors the full viewport info.

- [ ] **Step 3: Commit**

```bash
git add packages/canvas/src/collaboration/RemoteCursors.tsx packages/canvas/src/components/FlowbaseCanvas.tsx
git commit -m "perf(canvas): viewport culling for remote cursors"
```

---

### Task 4: Wire selection debounce in usePresence

**Files:**
- Modify: `packages/canvas/src/collaboration/usePresence.ts`

- [ ] **Step 1: Add debounce to selection sync**

In `packages/canvas/src/collaboration/usePresence.ts`, the `SELECTION_DEBOUNCE_MS` constant is imported but never used. The selection sync effect fires on every Zustand store change. Add a debounce:

Change the selection sync effect from:

```typescript
// Sync selection from Zustand to awareness
useEffect(() => {
  if (!awareness || !localStateRef.current) return

  const unsubscribe = useCanvasStore.subscribe((state) => {
    const selection = Array.from(state.selectedIds)
    if (!localStateRef.current) return

    const prev = localStateRef.current.selection
    if (
      selection.length === prev.length &&
      selection.every((id, i) => id === prev[i])
    ) {
      return
    }

    localStateRef.current = {
      ...localStateRef.current,
      selection,
    }
    awareness.setLocalState(localStateRef.current)
  })

  return unsubscribe
}, [awareness])
```

To:

```typescript
// Sync selection from Zustand to awareness (debounced)
useEffect(() => {
  if (!awareness || !localStateRef.current) return

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const unsubscribe = useCanvasStore.subscribe((state) => {
    const selection = Array.from(state.selectedIds)
    if (!localStateRef.current) return

    const prev = localStateRef.current.selection
    if (
      selection.length === prev.length &&
      selection.every((id, i) => id === prev[i])
    ) {
      return
    }

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (!localStateRef.current) return
      localStateRef.current = {
        ...localStateRef.current,
        selection,
      }
      awareness.setLocalState(localStateRef.current)
    }, SELECTION_DEBOUNCE_MS)
  })

  return () => {
    unsubscribe()
    if (debounceTimer) clearTimeout(debounceTimer)
  }
}, [awareness])
```

Also add `SELECTION_DEBOUNCE_MS` to the import if not already there:
```typescript
import { CURSOR_THROTTLE_MS, SELECTION_DEBOUNCE_MS, PRESENCE_COLORS, getPresenceColor, getPresenceName } from './constants'
```

- [ ] **Step 2: Commit**

```bash
git add packages/canvas/src/collaboration/usePresence.ts
git commit -m "perf(canvas): debounce selection sync to awareness"
```

---

### Task 5: Graceful degradation when collab server is down

**Files:**
- Modify: `apps/web/src/components/dialogs/SharePopover.tsx`

- [ ] **Step 1: Add server health check before starting session**

In `apps/web/src/components/dialogs/SharePopover.tsx`, the current useEffect auto-starts sharing immediately. Change it to check server health first:

Replace the existing auto-start effect:

```typescript
// Start sharing on first open if not already sharing
useEffect(() => {
  if (!isCollaborating && !roomId) {
    const id = generateRoomId();
    startCollaboration(id, true);
  }
}, [isCollaborating, roomId, startCollaboration]);
```

With:

```typescript
const [serverDown, setServerDown] = useState(false);

// Start sharing on first open — check server health first
useEffect(() => {
  if (isCollaborating || roomId) return;

  let cancelled = false;

  (async () => {
    try {
      const res = await fetch(`${COLLAB_HTTP_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (cancelled) return;
      if (res.ok) {
        const id = generateRoomId();
        startCollaboration(id, true);
      } else {
        setServerDown(true);
      }
    } catch {
      if (!cancelled) setServerDown(true);
    }
  })();

  return () => { cancelled = true; };
}, [isCollaborating, roomId, startCollaboration]);
```

Add the `serverDown` state declaration with the other useState calls at the top of the component.

- [ ] **Step 2: Add unavailable UI**

In the SharePopover return JSX, add a server-down state. Wrap the existing content and add a fallback before the closing `</div>`:

After the title/close-button header div and before the share link section, add:

```tsx
{serverDown && (
  <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5">
    <p className="text-xs font-medium text-red-600">Collaboration unavailable</p>
    <p className="mt-0.5 text-xs text-red-400">
      Could not reach the collaboration server. Solo editing continues to work normally.
    </p>
  </div>
)}
```

And conditionally hide the share link, collaborator list, and stop button when the server is down. Wrap them in:

```tsx
{!serverDown && (
  <>
    {/* Share link */}
    ...existing share link JSX...

    {/* Connection status */}
    ...existing connection status JSX...

    {/* Stop sharing */}
    ...existing stop button JSX...
  </>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dialogs/SharePopover.tsx
git commit -m "feat(web): graceful degradation when collab server is unavailable"
```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Task | Status |
|---|---|---|
| 5.1 Reconnection handling — banner | Task 1 | ✅ |
| 5.1 Tab sleep reconnect | Task 2 | ✅ |
| 5.1 Stale state detection | N/A | Yjs CRDT handles automatically |
| 5.2 Connection state UI | Task 1 | ✅ (banner + existing CollaboratorBar dots) |
| 5.3 Cursor throttling | Already done (Phase 3) | ✅ |
| 5.3 Selection debounce | Task 4 | ✅ |
| 5.3 Viewport culling | Task 3 | ✅ |
| 5.3 Freehand point buffering | N/A | Deferred — low priority, Yjs transact already batches |
| 5.4 Owner closes tab | N/A | y-websocket handles — room persists |
| 5.4 Max collaborators limit | N/A | Deferred — not needed for v1 |
| 5.5 Error handling table | Phase 4 | ✅ (already handled) |
| 5.6 Graceful degradation | Task 5 | ✅ |

**Deferred items** (not needed for a solid v1):
- Freehand point buffering — Yjs transact already batches, marginal improvement
- Max collaborators hard limit — soft 10-user limit from y-websocket is sufficient
- "Syncing changes..." overlay for large divergence — Yjs syncs fast enough that this is rarely noticeable
- Simultaneous text editing indicator — out of scope, would need per-element locking UI
