# Phase 4: Sharing UI & Routes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the user-facing sharing interface — Share button, link generation, join flow, and the `/collab` route that collaborators land on.

**Architecture:** The owner clicks Share in the editor toolbar, which generates a room ID, starts a collaboration session via `CollaborationProvider.startCollaboration()`, and displays a shareable link. Collaborators open the link, which loads a `/collab/[roomId]` Next.js route that wraps `CanvasEditor` in a `CollaborationProvider` with the room ID. The collab server gets two new HTTP endpoints for room status checking and room closure.

**Tech Stack:** Next.js App Router, React, Zustand, Tailwind CSS, Lucide icons, existing `@flowbase/canvas` collaboration module

---

## File Structure

```
packages/collab/src/
├── server.ts                          # MODIFY — add GET/DELETE /rooms/:roomId endpoints
├── room-manager.ts                    # MODIFY — add closeRoom() method

packages/canvas/src/collaboration/
├── types.ts                           # MODIFY — add sessionEnded to CollabContextValue
├── CollaborationProvider.tsx          # MODIFY — add sessionEnded detection on disconnect

apps/web/src/
├── lib/roomId.ts                      # CREATE — room ID generation utility
├── hooks/useAutoSave.ts               # MODIFY — add enabled flag
├── components/canvas/CanvasEditor.tsx  # MODIFY — optional projectId, share button, collab mode
├── components/canvas/EditorLoader.tsx  # MODIFY — wrap with CollaborationProvider
├── components/toolbar/ActionGroup.tsx  # MODIFY — add Share button
├── components/dialogs/SharePopover.tsx # CREATE — share link popover
├── components/collab/JoinScreen.tsx    # CREATE — join loading/error screen
├── components/collab/SessionEndedScreen.tsx # CREATE — session ended screen
├── app/collab/[roomId]/page.tsx        # CREATE — collab route
```

---

### Task 1: Server endpoints for room management

**Files:**
- Modify: `packages/collab/src/room-manager.ts`
- Modify: `packages/collab/src/server.ts`

- [ ] **Step 1: Add `closeRoom()` to RoomManager**

Add this method to the `RoomManager` class in `packages/collab/src/room-manager.ts`, right after `stopSharing()`:

```typescript
closeRoom(roomId: string): boolean {
  const room = this.rooms.get(roomId)
  if (!room) return false
  room.isSharing = false
  console.log(`[room] closed: ${roomId}`)
  const connections = Array.from(room.conns.keys())
  for (const conn of connections) {
    room.removeConn(conn)
    conn.close(4001, 'Session ended by owner')
  }
  this.destroyRoom(roomId)
  return true
}
```

Also change `private destroyRoom` to just `destroyRoom` (remove `private`) since `closeRoom` calls it and it's already used internally. Wait — `closeRoom` is inside the class, so `private` is fine. Keep it as-is.

- [ ] **Step 2: Add HTTP endpoints to server**

In `packages/collab/src/server.ts`, add two new routes in the `createServer` request handler, after the existing `/rooms` handler:

```typescript
// GET /rooms/:roomId — room info or 404
const roomIdMatch = req.url?.match(/^\/rooms\/([A-Za-z0-9_-]{12})$/)
if (roomIdMatch && req.method === 'GET') {
  const info = roomManager.getRoomInfo(roomIdMatch[1])
  if (info) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify(info))
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ error: 'Room not found' }))
  }
  return
}

// DELETE /rooms/:roomId — close room
if (roomIdMatch && req.method === 'DELETE') {
  const closed = roomManager.closeRoom(roomIdMatch[1])
  res.writeHead(closed ? 200 : 404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify({ closed }))
  return
}

// Handle CORS preflight for DELETE
if (roomIdMatch && req.method === 'OPTIONS') {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end()
  return
}
```

**Important:** The `roomIdMatch` regex extraction must happen before the default response at the end of the handler. Place these three blocks after the existing `if (req.url === '/rooms')` block and before the default `res.writeHead(200)` fallback.

Also add CORS headers to the existing `/rooms` endpoint:
```typescript
if (req.url === '/rooms') {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(roomManager.listRooms()))
  return
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/collab/src/room-manager.ts packages/collab/src/server.ts
git commit -m "feat(collab): add GET/DELETE /rooms/:roomId endpoints"
```

---

### Task 2: Extend CollaborationProvider with session-ended detection

**Files:**
- Modify: `packages/canvas/src/collaboration/types.ts`
- Modify: `packages/canvas/src/collaboration/CollaborationProvider.tsx`

- [ ] **Step 1: Add `sessionEnded` to types**

In `packages/canvas/src/collaboration/types.ts`, add `sessionEnded: boolean` to `CollabState`:

```typescript
export interface CollabState {
  isCollaborating: boolean
  roomId: string | null
  status: ConnectionStatus
  doc: Y.Doc | null
  awareness: Awareness | null
  sessionEnded: boolean
}
```

Update the default context in `CollaborationProvider.tsx` to include `sessionEnded: false`:

```typescript
export const CollabContext = createContext<CollabContextValue>({
  isCollaborating: false,
  roomId: null,
  status: 'disconnected',
  doc: null,
  awareness: null,
  sessionEnded: false,
  startCollaboration: () => {},
  stopCollaboration: () => {},
})
```

- [ ] **Step 2: Add session-ended detection to CollaborationProvider**

In `packages/canvas/src/collaboration/CollaborationProvider.tsx`:

1. Add `sessionEnded` state:
```typescript
const [sessionEnded, setSessionEnded] = useState(false)
```

2. In `startCollaboration`, after the `wsProvider.on('status', ...)` handler, add a disconnect check. Replace the existing status handler with:

```typescript
wsProvider.on('status', ({ status: wsStatus }: { status: string }) => {
  if (wsStatus === 'connected') {
    setStatus('connected')
  } else if (wsStatus === 'disconnected') {
    setStatus('disconnected')
    // Check if room still exists after a brief delay (allows for reconnect)
    setTimeout(async () => {
      // If already reconnected, skip
      if (providerRef.current?.wsconnected) return
      try {
        const httpUrl = COLLAB_SERVER_URL.replace(/^ws(s?)/, 'http$1')
        const res = await fetch(`${httpUrl}/rooms/${newRoomId}`)
        if (!res.ok) {
          setSessionEnded(true)
        }
      } catch {
        // Network error — don't assume session ended
      }
    }, 2000)
  } else {
    setStatus('connecting')
  }
})
```

3. Reset `sessionEnded` in `startCollaboration` (at the top, after existing cleanup):
```typescript
setSessionEnded(false)
```

4. Add `sessionEnded` to the context value:
```typescript
const value: CollabContextValue = {
  isCollaborating: status === 'connected',
  roomId,
  status,
  doc,
  awareness,
  sessionEnded,
  startCollaboration,
  stopCollaboration,
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/canvas/src/collaboration/types.ts packages/canvas/src/collaboration/CollaborationProvider.tsx
git commit -m "feat(canvas): add session-ended detection to CollaborationProvider"
```

---

### Task 3: Make CanvasEditor support collab mode

**Files:**
- Modify: `apps/web/src/hooks/useAutoSave.ts`
- Modify: `apps/web/src/components/canvas/CanvasEditor.tsx`

- [ ] **Step 1: Add `enabled` parameter to useAutoSave**

In `apps/web/src/hooks/useAutoSave.ts`, add an `enabled` parameter (defaults to `true`):

Change the signature:
```typescript
export function useAutoSave(projectId: string, stageRef: React.RefObject<Konva.Stage | null>, enabled = true) {
```

In the `subscribe` effect, guard with `enabled`:
```typescript
useEffect(() => {
  if (!enabled) return;
  let prevElements = useCanvasStore.getState().elements;
  const unsub = useCanvasStore.subscribe((state) => {
    // ... existing logic
  });
  return () => {
    unsub();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (pendingSave.current) {
      doSave();
    }
  };
}, [scheduleSave, doSave, enabled]);
```

- [ ] **Step 2: Make projectId optional in CanvasEditor**

In `apps/web/src/components/canvas/CanvasEditor.tsx`:

Change the props interface:
```typescript
interface CanvasEditorProps {
  projectId?: string;
  projectName: string;
}
```

Update the `useAutoSave` call:
```typescript
const isCollabMode = !projectId;
const { status: saveStatus, flushSave } = useAutoSave(projectId ?? '', stageRef, !isCollabMode);
```

Conditionally render the SaveIndicator — wrap the existing SaveIndicator block:
```tsx
{/* Save indicator — bottom right (editor mode only) */}
{!isCollabMode && (
  <div className="absolute bottom-4 right-4 z-10">
    <SaveIndicator status={saveStatus} onSave={flushSave} />
  </div>
)}
```

In the LogoPill, guard `flushSave` for collab mode:
```tsx
<LogoPill href="/" onBeforeNavigate={isCollabMode ? undefined : flushSave} />
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useAutoSave.ts apps/web/src/components/canvas/CanvasEditor.tsx
git commit -m "feat(web): make CanvasEditor support collab mode with optional projectId"
```

---

### Task 4: Wrap EditorLoader with CollaborationProvider

**Files:**
- Modify: `apps/web/src/components/canvas/EditorLoader.tsx`

- [ ] **Step 1: Add CollaborationProvider wrapper**

In `apps/web/src/components/canvas/EditorLoader.tsx`, import and wrap:

Add import:
```typescript
import { CollaborationProvider } from '@flowbase/canvas';
```

Change the return statement from:
```typescript
return <CanvasEditor projectId={projectId} projectName={project!.name} />;
```

To:
```typescript
return (
  <CollaborationProvider>
    <CanvasEditor projectId={projectId} projectName={project!.name} />
  </CollaborationProvider>
);
```

This provides the collab context to the canvas. No roomId is passed — the editor starts in non-collab mode. When the owner clicks Share, `startCollaboration()` will be called on the context.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/canvas/EditorLoader.tsx
git commit -m "feat(web): wrap EditorLoader with CollaborationProvider"
```

---

### Task 5: SharePopover component

**Files:**
- Create: `apps/web/src/lib/roomId.ts`
- Create: `apps/web/src/components/dialogs/SharePopover.tsx`

- [ ] **Step 1: Create room ID generation utility**

Create `apps/web/src/lib/roomId.ts`:

```typescript
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRoomId(): string {
  const array = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(array, (b) => CHARS[b % CHARS.length]).join('');
}
```

- [ ] **Step 2: Create SharePopover**

Create `apps/web/src/components/dialogs/SharePopover.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { useCollaboration, usePresence } from '@flowbase/canvas';
import { generateRoomId } from '@/lib/roomId';

const COLLAB_SERVER_URL = process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:4444';
const COLLAB_HTTP_URL = COLLAB_SERVER_URL.replace(/^ws(s?)/, 'http$1');

interface SharePopoverProps {
  onClose: () => void;
}

export default function SharePopover({ onClose }: SharePopoverProps) {
  const { isCollaborating, roomId, status, awareness, startCollaboration, stopCollaboration } =
    useCollaboration();
  const { remoteUsers } = usePresence(awareness);
  const [copied, setCopied] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Start sharing on first open if not already sharing
  useEffect(() => {
    if (!isCollaborating && !roomId) {
      const id = generateRoomId();
      startCollaboration(id, true);
    }
  }, [isCollaborating, roomId, startCollaboration]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const shareLink = roomId ? `${window.location.origin}/collab/${roomId}` : '';

  const handleCopy = useCallback(async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink]);

  const handleStopSharing = useCallback(async () => {
    if (!confirmStop) {
      setConfirmStop(true);
      return;
    }
    // Tell server to close room
    if (roomId) {
      try {
        await fetch(`${COLLAB_HTTP_URL}/rooms/${roomId}`, { method: 'DELETE' });
      } catch {
        // Best effort — local cleanup proceeds regardless
      }
    }
    stopCollaboration();
    onClose();
  }, [confirmStop, roomId, stopCollaboration, onClose]);

  return (
    <div
      ref={popoverRef}
      className="w-72 rounded-2xl bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#18181b]">Share Project</h3>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#a1a1aa] transition-colors hover:bg-black/5 hover:text-[#555]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Share link */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 truncate rounded-lg bg-[#fafafa] px-3 py-2 font-mono text-xs text-[#52525b]">
          {shareLink || 'Generating...'}
        </div>
        <button
          onClick={handleCopy}
          disabled={!shareLink}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#fafafa] disabled:opacity-40"
        >
          {copied ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <Copy size={14} className="text-[#a1a1aa]" />
          )}
        </button>
      </div>

      {/* Connection status */}
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-[#a1a1aa]">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-500'
                : status === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-400'
            }`}
          />
          <span>
            {status === 'connected'
              ? `Connected (${remoteUsers.length + 1})`
              : status === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
          </span>
        </div>

        {/* Collaborator list */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#52525b]">
            <div className="h-2 w-2 rounded-full bg-[#7c3aed]" />
            <span className="font-medium">You (Owner)</span>
          </div>
          {remoteUsers.map((user) => (
            <div
              key={user.clientId}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#52525b]"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stop sharing */}
      <button
        onClick={handleStopSharing}
        className={`w-full rounded-xl py-2 text-sm font-medium transition-colors ${
          confirmStop
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'text-red-500 hover:bg-red-50'
        }`}
      >
        {confirmStop ? 'Confirm — Stop Sharing' : 'Stop Sharing'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/roomId.ts apps/web/src/components/dialogs/SharePopover.tsx
git commit -m "feat(web): add SharePopover with link generation and stop sharing"
```

---

### Task 6: Add Share button to toolbar and wire in CanvasEditor

**Files:**
- Modify: `apps/web/src/components/toolbar/ActionGroup.tsx`
- Modify: `apps/web/src/components/canvas/CanvasEditor.tsx`

- [ ] **Step 1: Add Share button to ActionGroup**

In `apps/web/src/components/toolbar/ActionGroup.tsx`:

Add imports:
```typescript
import { Download, Settings, Keyboard, Share2 } from 'lucide-react';
```

Add prop:
```typescript
interface ActionGroupProps {
  onExport: () => void;
  onSettings: () => void;
  onShortcuts: () => void;
  onShare?: () => void;
  isSharing?: boolean;
}
```

Update the component to accept and use the new props:
```typescript
const ActionGroup = ({ onExport, onSettings, onShortcuts, onShare, isSharing }: ActionGroupProps) => {
  return (
    <FloatingPill className="flex items-center gap-0.5 p-1">
      {onShare && (
        <IconButton
          icon={Share2}
          label={isSharing ? 'Sharing' : 'Share'}
          size="sm"
          isActive={isSharing}
          onClick={onShare}
        />
      )}
      <IconButton icon={Download} label="Export" size="sm" onClick={onExport} />
      <IconButton icon={Keyboard} label="Shortcuts" shortcut="?" size="sm" onClick={onShortcuts} />
      <IconButton icon={Settings} label="Settings" size="sm" onClick={onSettings} />
    </FloatingPill>
  );
};
```

- [ ] **Step 2: Wire SharePopover into CanvasEditor**

In `apps/web/src/components/canvas/CanvasEditor.tsx`:

Add imports:
```typescript
import { useCollaboration } from '@flowbase/canvas';
import SharePopover from '../dialogs/SharePopover';
```

Add state (with the other `useState` calls near line 50):
```typescript
const [shareOpen, setShareOpen] = useState(false);
```

Add collaboration hook (after the existing Zustand selectors, around line 84):
```typescript
const { isCollaborating } = useCollaboration();
```

Update the ActionGroup JSX to pass the new props:
```tsx
<ActionGroup
  onExport={() => setExportOpen(true)}
  onShortcuts={() => setShortcutsOpen(true)}
  onSettings={() => {
    setSettingsHint(undefined);
    setSettingsOpen(true);
  }}
  onShare={() => setShareOpen(true)}
  isSharing={isCollaborating}
/>
```

Add the SharePopover below the ActionGroup's `</div>` (still inside the return JSX):
```tsx
{/* Share popover — anchored to top-right */}
{shareOpen && (
  <div className="absolute right-4 top-16 z-20">
    <SharePopover onClose={() => setShareOpen(false)} />
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/toolbar/ActionGroup.tsx apps/web/src/components/canvas/CanvasEditor.tsx
git commit -m "feat(web): add Share button to toolbar with SharePopover"
```

---

### Task 7: JoinScreen and SessionEndedScreen components

**Files:**
- Create: `apps/web/src/components/collab/JoinScreen.tsx`
- Create: `apps/web/src/components/collab/SessionEndedScreen.tsx`

- [ ] **Step 1: Create JoinScreen**

Create `apps/web/src/components/collab/JoinScreen.tsx`:

```tsx
'use client';

interface JoinScreenProps {
  status: 'connecting' | 'connected' | 'error';
  error?: string;
}

export default function JoinScreen({ status, error }: JoinScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Logo */}
        <div className="mb-2 text-2xl font-bold tracking-tight text-[#18181b]">
          Flowbase
        </div>

        {status === 'error' ? (
          <>
            <p className="text-sm text-red-500">
              {error || "This session doesn't exist or has ended."}
            </p>
            <a
              href="/"
              className="mt-2 rounded-xl bg-[#18181b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#27272a]"
            >
              Go to Flowbase
            </a>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
            <p className="text-sm text-[#a1a1aa]">
              {status === 'connecting'
                ? 'Joining collaborative session...'
                : 'Loading canvas...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SessionEndedScreen**

Create `apps/web/src/components/collab/SessionEndedScreen.tsx`:

```tsx
'use client';

import { exportFlowbase } from '@/lib/export';

interface SessionEndedScreenProps {
  projectName?: string;
}

export default function SessionEndedScreen({ projectName }: SessionEndedScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex w-80 flex-col items-center gap-4 text-center">
        <h1 className="text-lg font-semibold text-[#18181b]">Session Ended</h1>
        <p className="text-sm text-[#a1a1aa]">
          The owner has stopped sharing this project.
        </p>

        <div className="mt-2 flex w-full flex-col gap-2">
          <button
            onClick={() => exportFlowbase(projectName || 'Shared Canvas')}
            className="w-full rounded-xl bg-[#18181b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#27272a]"
          >
            Export a Copy (.flowbase)
          </button>
          <a
            href="/"
            className="w-full rounded-xl px-6 py-2.5 text-sm text-[#a1a1aa] transition-colors hover:bg-[#fafafa]"
          >
            Go to Flowbase
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/collab/JoinScreen.tsx apps/web/src/components/collab/SessionEndedScreen.tsx
git commit -m "feat(web): add JoinScreen and SessionEndedScreen components"
```

---

### Task 8: /collab/[roomId] route

**Files:**
- Create: `apps/web/src/app/collab/[roomId]/page.tsx`

- [ ] **Step 1: Create the collab page**

Create `apps/web/src/app/collab/[roomId]/page.tsx`:

```tsx
'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CollaborationProvider, useCollaboration } from '@flowbase/canvas';

const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor'), {
  ssr: false,
});

const JoinScreen = dynamic(() => import('@/components/collab/JoinScreen'), {
  ssr: false,
});

const SessionEndedScreen = dynamic(() => import('@/components/collab/SessionEndedScreen'), {
  ssr: false,
});

const COLLAB_SERVER_URL = process.env.NEXT_PUBLIC_COLLAB_URL || 'ws://localhost:4444';
const COLLAB_HTTP_URL = COLLAB_SERVER_URL.replace(/^ws(s?)/, 'http$1');

type CollabState = 'joining' | 'connected' | 'ended' | 'error';

function CollabInner({ roomId }: { roomId: string }) {
  const { isCollaborating, status, sessionEnded } = useCollaboration();
  const [collabState, setCollabState] = useState<CollabState>('joining');
  const [error, setError] = useState<string>();

  // Check room existence on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${COLLAB_HTTP_URL}/rooms/${roomId}`);
        if (!res.ok && !cancelled) {
          setCollabState('error');
          setError("This session doesn't exist or has ended.");
        }
      } catch {
        // Server unreachable — let WebSocket attempt handle it
      }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  // Track connection state
  useEffect(() => {
    if (sessionEnded) {
      setCollabState('ended');
    } else if (isCollaborating) {
      setCollabState('connected');
    } else if (status === 'connecting') {
      setCollabState('joining');
    }
  }, [isCollaborating, status, sessionEnded]);

  if (collabState === 'ended') {
    return <SessionEndedScreen />;
  }

  if (collabState === 'error') {
    return <JoinScreen status="error" error={error} />;
  }

  if (collabState === 'joining') {
    return <JoinScreen status={status === 'connecting' ? 'connecting' : 'connected'} />;
  }

  // connected
  return <CanvasEditor projectName="Shared Canvas" />;
}

export default function CollabPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);

  return (
    <CollaborationProvider roomId={roomId} isOwner={false}>
      <CollabInner roomId={roomId} />
    </CollaborationProvider>
  );
}
```

**Key points:**
- `CollabPage` wraps everything in `CollaborationProvider` with the `roomId` and `isOwner={false}`
- `CollabInner` is a separate component inside the provider so it can use `useCollaboration()`
- Room existence is checked via HTTP on mount — if 404, shows error immediately
- State transitions: joining → connected (renders CanvasEditor) or → ended (renders SessionEndedScreen)
- `CanvasEditor` is called without `projectId`, triggering collab mode (no auto-save, no save indicator)

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/collab/[roomId]/page.tsx
git commit -m "feat(web): add /collab/[roomId] route for collaborators"
```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Task |
|---|---|
| Share button in editor toolbar | Task 6 |
| Click Share → generates link, shows popover | Task 5 (SharePopover auto-starts session) |
| Copy link to clipboard | Task 5 (handleCopy) |
| Stop Sharing with confirmation | Task 5 (two-click confirm) |
| Share button shows active state (green dot) | Task 6 (isActive prop on IconButton) |
| `/collab/[roomId]` route | Task 8 |
| JoinScreen with loading state | Task 7 |
| SessionEndedScreen with export | Task 7 |
| Collaborator sees full canvas after joining | Task 8 (CollabInner renders CanvasEditor) |
| Owner editor unchanged (auto-save works) | Task 3 (enabled flag) + Task 4 (CollaborationProvider wrapper) |
| Server-side room closure | Task 1 |
| Session ended detection | Task 2 |

**Deferred to Phase 5:**
- Custom name input on JoinScreen (auto-assigned names used for now)
- Click-to-pan on CollaboratorBar pills
- Owner crown/star indicator in collaborator list
- Reconnection handling & error recovery
- Read-only snapshot on session end (currently exports from live state)
