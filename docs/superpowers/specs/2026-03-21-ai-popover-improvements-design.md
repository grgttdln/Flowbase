# AI Popover Improvements Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Related:** Phase 6 (AI Integration), AIResponsePopover.tsx

---

## Goal

Upgrade the AI response popover to support multiple simultaneous instances, drag-to-move, and collapse/expand. Popovers persist until explicitly closed by the user.

---

## Behavior

### Multiple popovers

Each AI action (Explain, Suggest, Summarize) creates a **new** popover instance. Previous popovers remain on screen. Each popover is independent — its own position, text stream, loading state, error state, and collapsed flag.

### Dragging

The popover header bar is the drag handle. Drag uses pointer events (`onPointerDown`/`onPointerMove`/`onPointerUp`) with `setPointerCapture` for reliable tracking outside the element. Position updates in real-time during drag. After drag, the popover is clamped to stay within the viewport (16px margin).

### Collapse/Expand

A chevron toggle button (ChevronDown/ChevronUp) in the header collapses or expands the popover:
- **Expanded:** Full content area with streaming text, copy button, error/retry — same as current behavior.
- **Collapsed:** Header bar only, showing action label + first ~60 characters of response text, truncated with ellipsis. Height transition via CSS `max-height` (150ms ease).

### Close

The X button removes that specific popover from the array. It also aborts any in-flight request for that popover.

### Z-ordering

Clicking or starting a drag on a popover brings it to the front (highest z-index among all popovers). Base z-index is 50; active popover gets z-index 51.

---

## Data Model

### Popover instance

```ts
interface AIPopoverInstance {
  id: string;              // crypto.randomUUID()
  x: number;
  y: number;
  action: AIActionType;    // 'explain' | 'suggest' | 'summarize'
  text: string;
  isLoading: boolean;
  error: string | null;
  collapsed: boolean;
}
```

### State in CanvasEditor

Replace:
```ts
const [aiPopover, setAiPopover] = useState<{ x: number; y: number } | null>(null);
const [lastAIAction, setLastAIAction] = useState<...>(null);
```

With:
```ts
const [aiPopovers, setAiPopovers] = useState<AIPopoverInstance[]>([]);
const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
```

---

## Component Changes

### AIResponsePopover.tsx

**New props:**
```ts
interface AIResponsePopoverProps {
  id: string;
  x: number;
  y: number;
  action: AIActionType;
  text: string;
  isLoading: boolean;
  error: string | null;
  collapsed: boolean;
  isActive: boolean;         // whether this popover is on top
  onClose: (id: string) => void;
  onRetry: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggleCollapse: (id: string) => void;
  onActivate: (id: string) => void;
}
```

**Header changes:**
- Left side: Action label (e.g., "AI: Explain")
- Right side: Collapse toggle (ChevronDown/ChevronUp), Close button (X)
- Entire header is the drag handle (cursor: grab / grabbing)

**Collapsed state:**
- Header bar + single line preview: `"AI: Explain — The diagram shows a user..."` (truncated to ~60 chars)
- No content area, no footer
- Reduced visual height with smooth transition

**Drag implementation:**
```ts
const handlePointerDown = (e: React.PointerEvent) => {
  onActivate(id);
  dragOffset.current = { x: e.clientX - x, y: e.clientY - y };
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  setDragging(true);
};
const handlePointerMove = (e: React.PointerEvent) => {
  if (!dragging) return;
  const newX = Math.max(16, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 376));
  const newY = Math.max(16, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100));
  onMove(id, newX, newY);
};
const handlePointerUp = (e: React.PointerEvent) => {
  (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  setDragging(false);
};
```

### CanvasEditor.tsx

**runAIAction changes:**
- Creates a new `AIPopoverInstance` with unique id, appends to `aiPopovers` array
- Each popover manages its own streaming via a per-popover approach: store an `AbortController` per popover id in a ref map

**Streaming per popover:**
Instead of a single `useAIAction` hook, manage streaming inline:
- `abortControllers` ref: `Map<string, AbortController>`
- When creating a popover, start a fetch with its own AbortController
- On stream chunks, update that popover's `text` in the array
- On close, abort that popover's controller and remove from array

---

## Action Labels

| AIActionType | Header label |
|-------------|-------------|
| explain | AI: Explain |
| suggest | AI: Suggest |
| summarize | AI: Summarize |

---

## Scope Exclusions

- Popover resizing (fixed 360px width)
- Markdown rendering in responses (plain text only)
- Popover snapping/docking to screen edges
- Persisting popovers across page reloads
- Popover minimizing to a tray/dock
