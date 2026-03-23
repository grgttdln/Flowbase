# AI Auto-Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-powered auto-layout feature that suggests better element positioning, shows a ghost preview, and animates elements to new positions on apply.

**Architecture:** Extends the existing AI pipeline with a `layout` action type. Elements are serialized as structured JSON with IDs, AI returns repositioned coordinates, a ghost preview renders on a separate Konva layer inside FlowbaseCanvas, and applying animates via RAF-driven state updates. Single undo step.

**Tech Stack:** React, react-konva, Zustand, Next.js API routes, OpenRouter (SSE streaming), TypeScript

---

### Task 1: Add `layout` to AIActionType and prompt template

**Files:**
- Modify: `packages/shared/src/types/ai.ts:3`
- Modify: `packages/ai/src/prompts.ts:3-53`

These two changes must be atomic since `SYSTEM_PROMPTS` is typed as `Record<AIActionType, string>`.

- [ ] **Step 1: Add `layout` to AIActionType union**

In `packages/shared/src/types/ai.ts`, change line 3:

```typescript
export type AIActionType = 'explain' | 'suggest' | 'summarize' | 'generate' | 'layout';
```

- [ ] **Step 2: Add layout prompt template**

In `packages/ai/src/prompts.ts`, add the `layout` entry to `SYSTEM_PROMPTS` (after `generate`):

```typescript
  layout:
    'You are a diagramming layout assistant. The user will provide a JSON object describing canvas elements ' +
    'with their current positions. Your job is to suggest improved positions for better visual layout.\n\n' +
    'Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:\n' +
    '{"layout": [{"id": "element-id", "x": 100, "y": 50}, ...]}\n\n' +
    'Rules:\n' +
    '- Return a position entry for every element provided\n' +
    '- Only change x and y — do NOT change sizes, types, or any other properties\n' +
    '- Align related elements (same type, same group) on shared axes\n' +
    '- Use even spacing between elements (40-80px gaps)\n' +
    '- Group elements with the same groupId close together\n' +
    '- Prefer left-to-right or top-to-bottom flow\n' +
    '- Avoid overlapping elements — leave clear space between them\n' +
    '- Keep all positions within -5000 to 10000 for both x and y\n' +
    '- Preserve the general intent of the diagram while improving clarity\n\n' +
    'Respond with ONLY the JSON object.',
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p packages/ai/tsconfig.json`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/ai.ts packages/ai/src/prompts.ts
git commit -m "feat(ai): add layout action type and prompt template"
```

---

### Task 2: Add `serializeForLayout` function

**Files:**
- Modify: `packages/ai/src/serializer.ts`
- Modify: `packages/ai/src/index.ts:3`

- [ ] **Step 1: Add serializeForLayout to serializer.ts**

Append to `packages/ai/src/serializer.ts` after the existing `serializeElements` function:

```typescript
export function serializeForLayout(elements: Element[]): string {
  const truncated = elements.length > MAX_ELEMENTS;
  const subset = truncated ? elements.slice(0, MAX_ELEMENTS) : elements;

  // Exclude bound arrows — their positions are determined by the binding system
  const layoutElements = subset.filter(
    (el) => !(el.startBinding || el.endBinding),
  );

  const data = layoutElements.map((el) => ({
    id: el.id,
    type: el.type,
    x: Math.round(el.x),
    y: Math.round(el.y),
    width: Math.round(el.width),
    height: Math.round(el.height),
    text: el.text ?? null,
    groupId: el.groupId ?? null,
  }));

  return JSON.stringify({ elements: data });
}
```

- [ ] **Step 2: Export serializeForLayout from barrel**

In `packages/ai/src/index.ts`, change line 3:

```typescript
export { serializeElements, serializeForLayout } from './serializer';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p packages/ai/tsconfig.json`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/ai/src/serializer.ts packages/ai/src/index.ts
git commit -m "feat(ai): add serializeForLayout for structured JSON serialization"
```

---

### Task 3: Add `parseLayoutResponse` function

**Files:**
- Modify: `packages/ai/src/parser.ts`
- Modify: `packages/ai/src/index.ts`

- [ ] **Step 1: Add LayoutParseResult interface and parseLayoutResponse function**

Append to `packages/ai/src/parser.ts`:

```typescript
export interface LayoutPosition {
  id: string;
  x: number;
  y: number;
}

export interface LayoutParseResult {
  positions: LayoutPosition[];
  warnings: string[];
}

function extractLayoutJSON(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const jsonMatch = trimmed.match(/\{[\s\S]*"layout"[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return trimmed;
}

export function parseLayoutResponse(text: string, existingIds: string[]): LayoutParseResult {
  const warnings: string[] = [];
  const idSet = new Set(existingIds);

  const jsonStr = extractLayoutJSON(text);
  let parsed: { layout?: unknown[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Could not parse AI layout response as JSON. Try again.');
  }

  if (!parsed.layout || !Array.isArray(parsed.layout)) {
    throw new Error('AI response missing "layout" array. Try again.');
  }

  const positions: LayoutPosition[] = [];

  for (let i = 0; i < parsed.layout.length; i++) {
    const raw = parsed.layout[i] as Record<string, unknown>;

    if (typeof raw.id !== 'string') {
      warnings.push(`Layout entry ${i}: missing or invalid id, skipping`);
      continue;
    }

    if (!idSet.has(raw.id)) {
      warnings.push(`Layout entry ${i}: id "${raw.id}" not found on canvas, skipping`);
      continue;
    }

    if (typeof raw.x !== 'number' || typeof raw.y !== 'number') {
      warnings.push(`Layout entry ${i}: missing x or y coordinate, skipping`);
      continue;
    }

    positions.push({
      id: raw.id,
      x: clamp(raw.x, -5000, 10000),
      y: clamp(raw.y, -5000, 10000),
    });
  }

  return { positions, warnings };
}
```

- [ ] **Step 2: Export from barrel**

In `packages/ai/src/index.ts`, add:

```typescript
export { parseLayoutResponse } from './parser';
export type { LayoutParseResult, LayoutPosition } from './parser';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p packages/ai/tsconfig.json`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/ai/src/parser.ts packages/ai/src/index.ts
git commit -m "feat(ai): add parseLayoutResponse for layout position parsing"
```

---

### Task 4: Extend API route to handle `layout` action

**Files:**
- Modify: `apps/web/src/app/api/ai/route.ts:2,5,31-55`

- [ ] **Step 1: Update imports**

In `apps/web/src/app/api/ai/route.ts`, change line 2:

```typescript
import { streamChat, serializeElements, serializeForLayout, buildMessages, AIError } from '@flowbase/ai';
```

- [ ] **Step 2: Add `layout` to VALID_ACTIONS**

Change line 5:

```typescript
const VALID_ACTIONS: AIActionType[] = ['explain', 'suggest', 'summarize', 'generate', 'layout'];
```

- [ ] **Step 3: Add layout case to prompt building**

Replace the prompt-building block (lines 31-56) with:

```typescript
  if (action === 'generate') {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return Response.json({ error: 'Prompt required for generate action' }, { status: 400 });
    }
    messages = buildMessages('generate', prompt.trim());
  } else if (action === 'layout') {
    if (!scene?.elements || !Array.isArray(scene.elements)) {
      return Response.json({ error: 'Invalid scene' }, { status: 400 });
    }
    if (scene.elements.length < 2) {
      return Response.json({ error: 'Need at least 2 elements for layout' }, { status: 400 });
    }
    const serialized = serializeForLayout(scene.elements);
    messages = buildMessages('layout', serialized);
  } else {
    if (!scene?.elements || !Array.isArray(scene.elements)) {
      return Response.json({ error: 'Invalid scene' }, { status: 400 });
    }
    if (selectedIds && !Array.isArray(selectedIds)) {
      return Response.json({ error: 'Invalid selectedIds' }, { status: 400 });
    }

    let elements = scene.elements;
    if (selectedIds && selectedIds.length > 0) {
      const idSet = new Set(selectedIds);
      elements = elements.filter((el) => idSet.has(el.id));
    }

    if (elements.length === 0) {
      return Response.json({ error: 'No elements to analyze' }, { status: 400 });
    }

    const serialized = serializeElements(elements);
    messages = buildMessages(action as AIActionType, serialized);
  }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p apps/web/tsconfig.json`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/ai/route.ts
git commit -m "feat(ai): handle layout action in API route"
```

---

### Task 5: Add `layout` to ContextMenu

**Files:**
- Modify: `apps/web/src/components/canvas/ContextMenu.tsx`

- [ ] **Step 1: Add `layout` to ContextMenuAction type**

In `ContextMenu.tsx`, add `'layout'` to the union (after `'generate'`):

```typescript
export type ContextMenuAction =
  | 'copy'
  | 'paste'
  | 'delete'
  | 'group'
  | 'ungroup'
  | 'bringForward'
  | 'sendBackward'
  | 'alignLeft'
  | 'alignCenterH'
  | 'alignRight'
  | 'alignTop'
  | 'alignCenterV'
  | 'alignBottom'
  | 'distributeH'
  | 'distributeV'
  | 'explain'
  | 'suggest'
  | 'summarize'
  | 'generate'
  | 'layout';
```

- [ ] **Step 2: Add `needsMinElements` to MenuItem and `elementCount` to ContextMenuProps**

Update the `MenuItem` interface to add `needsMinElements`:

```typescript
interface MenuItem {
  action: ContextMenuAction;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  isAI?: boolean;
  needsSelection?: boolean;
  needsMultiSelection?: boolean;
  needsMinElements?: number;
}
```

Add `elementCount` as an **optional** prop to `ContextMenuProps` (optional so existing usage compiles without changes until Task 8):

```typescript
interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  selectionCount: number;
  elementCount?: number;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}
```

Update the component signature to destructure `elementCount` with a default of `0`:

```typescript
const ContextMenu = ({ x, y, hasSelection, selectionCount, elementCount = 0, onAction, onClose }: ContextMenuProps) => {
```

- [ ] **Step 3: Add Auto-Layout menu item**

Add to MENU_ITEMS, after the `summarize` item (line 63). Note: `isAI: true` means the Sparkles icon will render (matching other AI items), so no new icon import is needed. We use `Sparkles` as the `icon` value:

```typescript
  { action: 'layout', label: 'Auto-Layout', icon: Sparkles, isAI: true, needsMinElements: 2 },
```

- [ ] **Step 4: Update visibility filter**

In the `visibleItems` filter (line 134-139), add the `needsMinElements` check:

```typescript
  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item === 'divider') return true;
    if (item.needsSelection && !hasSelection) return false;
    if (item.needsMultiSelection && selectionCount < 2) return false;
    if (item.needsMinElements && elementCount < item.needsMinElements) return false;
    return true;
  });
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p apps/web/tsconfig.json`
Expected: No errors (elementCount is optional, so existing CanvasEditor usage compiles)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/canvas/ContextMenu.tsx
git commit -m "feat(canvas): add Auto-Layout to context menu with element count visibility"
```

---

### Task 6: Add ghost preview layer to FlowbaseCanvas

**Files:**
- Modify: `packages/canvas/src/components/FlowbaseCanvas.tsx`

- [ ] **Step 1: Add LayoutPreviewPosition type and prop**

At the top of `FlowbaseCanvas.tsx`, after existing imports, add:

```typescript
export interface LayoutPreviewPosition {
  id: string;
  x: number;
  y: number;
}
```

Add to the `FlowbaseCanvasProps` interface:

```typescript
interface FlowbaseCanvasProps {
  width: number;
  height: number;
  stageRef?: React.RefObject<Konva.Stage | null>;
  onContextMenu?: (e: { x: number; y: number; elementId?: string }) => void;
  layoutPreview?: LayoutPreviewPosition[] | null;
}
```

Destructure it in the component:

```typescript
const FlowbaseCanvas = ({ width, height, stageRef: externalStageRef, onContextMenu, layoutPreview }: FlowbaseCanvasProps) => {
```

- [ ] **Step 2: Import Konva shapes for ghost rendering**

Add to imports at the top:

```typescript
import { Stage, Layer, Rect, Ellipse, Line, Text, Group } from 'react-konva';
```

(Replace the existing `import { Stage, Layer } from 'react-konva';`)

- [ ] **Step 3: Add ghost preview layer rendering**

Before the closing `</Stage>` tag in the JSX, add the ghost preview layer. Find the `</Stage>` closing tag and add before it:

```typescript
        {/* Layout preview ghost layer */}
        {layoutPreview && layoutPreview.length > 0 && (
          <Layer listening={false}>
            {layoutPreview.map((pos) => {
              const el = elements.find((e) => e.id === pos.id);
              if (!el) return null;

              const currentCenterX = el.x + el.width / 2;
              const currentCenterY = el.y + el.height / 2;
              const newCenterX = pos.x + el.width / 2;
              const newCenterY = pos.y + el.height / 2;

              return (
                <Group key={`ghost-${pos.id}`}>
                  {/* Movement line */}
                  <Line
                    points={[currentCenterX, currentCenterY, newCenterX, newCenterY]}
                    stroke="#228BE6"
                    strokeWidth={1}
                    dash={[4, 4]}
                    opacity={0.4}
                  />
                  {/* Ghost shape */}
                  {el.type === 'ellipse' ? (
                    <Ellipse
                      x={pos.x + el.width / 2}
                      y={pos.y + el.height / 2}
                      radiusX={el.width / 2}
                      radiusY={el.height / 2}
                      stroke="#228BE6"
                      strokeWidth={2}
                      dash={[6, 4]}
                      opacity={0.3}
                    />
                  ) : el.type === 'diamond' ? (
                    <Line
                      points={[
                        pos.x + el.width / 2, pos.y,
                        pos.x + el.width, pos.y + el.height / 2,
                        pos.x + el.width / 2, pos.y + el.height,
                        pos.x, pos.y + el.height / 2,
                      ]}
                      closed
                      stroke="#228BE6"
                      strokeWidth={2}
                      dash={[6, 4]}
                      opacity={0.3}
                    />
                  ) : el.type === 'text' ? (
                    <Text
                      x={pos.x}
                      y={pos.y}
                      width={el.width}
                      height={el.height}
                      text={el.text ?? ''}
                      fontSize={el.fontSize ?? 16}
                      fill="#228BE6"
                      opacity={0.3}
                    />
                  ) : (
                    <Rect
                      x={pos.x}
                      y={pos.y}
                      width={el.width}
                      height={el.height}
                      stroke="#228BE6"
                      strokeWidth={2}
                      dash={[6, 4]}
                      opacity={0.3}
                      cornerRadius={el.type === 'rectangle' ? 4 : 0}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        )}
```

- [ ] **Step 4: Export the type from barrel**

In `packages/canvas/src/index.ts`, add:

```typescript
export type { LayoutPreviewPosition } from './components/FlowbaseCanvas';
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p packages/canvas/tsconfig.json`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add packages/canvas/src/components/FlowbaseCanvas.tsx packages/canvas/src/index.ts
git commit -m "feat(canvas): add ghost preview layer for layout suggestions"
```

---

### Task 7: Create LayoutPreview DOM overlay component

**Files:**
- Create: `apps/web/src/components/ai/LayoutPreview.tsx`

- [ ] **Step 1: Create LayoutPreview component**

```typescript
'use client';

import { useEffect } from 'react';

interface LayoutPreviewProps {
  onApply: () => void;
  onCancel: () => void;
}

const LayoutPreview = ({ onApply, onCancel }: LayoutPreviewProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApply, onCancel]);

  return (
    <div
      className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
      style={{ animation: 'contextMenuIn 150ms ease-out' }}
    >
      <span className="text-[13px] font-medium text-[#666666]">
        Layout preview
      </span>
      <button
        onClick={onCancel}
        className="rounded-lg px-4 py-1.5 text-[13px] font-medium text-[#666666] transition-colors hover:bg-black/[0.04]"
      >
        Cancel
      </button>
      <button
        onClick={onApply}
        className="rounded-lg bg-[#007AFF] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0066DD]"
      >
        Apply Layout
      </button>
    </div>
  );
};

export default LayoutPreview;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p apps/web/tsconfig.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ai/LayoutPreview.tsx
git commit -m "feat(ai): add LayoutPreview Apply/Cancel overlay component"
```

---

### Task 8: Wire layout action into CanvasEditor

**Files:**
- Modify: `apps/web/src/components/canvas/CanvasEditor.tsx`

This is the main integration task. It connects the context menu action to the AI call, shows the loading indicator, manages the preview state, handles apply with animation, and handles cancel.

- [ ] **Step 1: Add imports**

Add to the imports at the top of `CanvasEditor.tsx`:

```typescript
import { parseLayoutResponse } from '@flowbase/ai';
import type { LayoutPreviewPosition } from '@flowbase/canvas';
import LayoutPreview from '../ai/LayoutPreview';
```

- [ ] **Step 2: Add state variables**

After the existing state declarations (after line 50, after `abortControllers`), add:

```typescript
  const [layoutPreview, setLayoutPreview] = useState<LayoutPreviewPosition[] | null>(null);
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const layoutAbortController = useRef<AbortController | null>(null);
```

Also add `pushHistory` and `setElements` to the `useCanvasStore` destructuring (`setElements` already exists in the store at line ~127 of useCanvasStore.ts):

```typescript
  const {
    // ... existing ...
    pushHistory,
    setElements,
  } = useCanvasStore();
```

Add an Escape handler for cancelling during the loading phase (before preview appears):

```typescript
  // Cancel layout loading on Escape
  useEffect(() => {
    if (!isLayoutLoading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (layoutAbortController.current) {
          layoutAbortController.current.abort();
          layoutAbortController.current = null;
        }
        setIsLayoutLoading(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutLoading]);
```

- [ ] **Step 3: Add runLayoutAction function**

After the `runAIAction` callback, add:

```typescript
  const runLayoutAction = useCallback(async () => {
    // Dismiss any existing preview
    setLayoutPreview(null);
    setIsLayoutLoading(true);

    const { apiKey, model } = getAISettings();
    if (!apiKey) {
      setSettingsHint('Enter your OpenRouter API key to use AI features.');
      setSettingsOpen(true);
      setIsLayoutLoading(false);
      return;
    }

    const controller = new AbortController();
    layoutAbortController.current = controller;

    try {
      const scene = { version: 1, elements };
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ action: 'layout', scene, model }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      // Accumulate full SSE response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let sseBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'string') {
              fullText += parsed;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected') throw e;
          }
        }
      }

      // Parse layout response
      const existingIds = elements.map((el) => el.id);
      const result = parseLayoutResponse(fullText, existingIds);

      if (result.positions.length === 0) {
        throw new Error('AI could not generate layout suggestions. Try again.');
      }

      setLayoutPreview(result.positions);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      // Show error as a brief toast-like popover
      const errorMsg = e instanceof Error ? e.message : 'Layout failed';
      alert(errorMsg); // Simple error display — can be upgraded to toast later
    } finally {
      setIsLayoutLoading(false);
      layoutAbortController.current = null;
    }
  }, [elements]);
```

- [ ] **Step 4: Add handleApplyLayout with animation**

After `runLayoutAction`, add:

```typescript
  const handleApplyLayout = useCallback(() => {
    if (!layoutPreview) return;

    // Build position map for quick lookup
    const posMap = new Map(layoutPreview.map((p) => [p.id, { x: p.x, y: p.y }]));

    // Capture starting positions for animation
    const startPositions = new Map<string, { x: number; y: number }>();
    for (const el of elements) {
      if (posMap.has(el.id)) {
        startPositions.set(el.id, { x: el.x, y: el.y });
      }
    }

    // Clear preview (ghost layer disappears)
    setLayoutPreview(null);

    // Push history once (for undo)
    pushHistory();

    // Disable interaction during animation
    setIsAnimating(true);

    // Animate over 300ms
    const duration = 300;
    const startTime = performance.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      const updated = elements.map((el) => {
        const start = startPositions.get(el.id);
        const target = posMap.get(el.id);
        if (!start || !target) return el;

        return {
          ...el,
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
        };
      });

      setElements(updated);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [layoutPreview, elements, pushHistory, setElements]);

  const handleCancelLayout = useCallback(() => {
    setLayoutPreview(null);
    // Also cancel any in-flight request
    if (layoutAbortController.current) {
      layoutAbortController.current.abort();
      layoutAbortController.current = null;
    }
  }, []);
```

- [ ] **Step 5: Add `layout` case to handleContextMenuAction**

In the `handleContextMenuAction` switch, add before the closing `}`:

```typescript
      case 'layout':
        runLayoutAction();
        break;
```

Add `runLayoutAction` to the dependency array of `handleContextMenuAction`.

- [ ] **Step 6: Pass `elementCount` to ContextMenu**

In the JSX where `<ContextMenu>` is rendered, add the `elementCount` prop:

```typescript
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasSelection={selectedIds.size > 0}
          selectionCount={selectedIds.size}
          elementCount={elements.length}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
```

- [ ] **Step 7: Pass `layoutPreview` to FlowbaseCanvas**

Update the `<FlowbaseCanvas>` JSX to pass the preview:

```typescript
      <FlowbaseCanvas
        width={dimensions.width}
        height={dimensions.height}
        stageRef={stageRef}
        onContextMenu={handleContextMenu}
        layoutPreview={layoutPreview}
      />
```

- [ ] **Step 8: Add `isAnimating` pointer-events guard, loading indicator, and LayoutPreview overlay**

On the root `<div>` of the component, add a conditional `pointerEvents` style to block interaction during animation:

```typescript
    <div
      className="relative h-screen w-screen overflow-hidden bg-white"
      style={isAnimating ? { pointerEvents: 'none' } : undefined}
    >
```

After the `{/* AI Response Popovers */}` section, add:

```typescript
      {/* Layout loading indicator */}
      {isLayoutLoading && (
        <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
          <span className="text-[13px] font-medium text-[#666666]">Analyzing layout…</span>
        </div>
      )}

      {/* Layout preview controls */}
      {layoutPreview && (
        <LayoutPreview onApply={handleApplyLayout} onCancel={handleCancelLayout} />
      )}
```

- [ ] **Step 9: Verify TypeScript compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && npx tsc --noEmit -p apps/web/tsconfig.json`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/canvas/CanvasEditor.tsx
git commit -m "feat(ai): wire auto-layout action with preview, animation, and undo"
```

---

### Task 9: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

Run: `cd /Users/georgette/Desktop/Flowbase && npm run dev` (or `pnpm dev`)

- [ ] **Step 2: Test happy path**

1. Open the canvas in browser
2. Add 3+ shapes to the canvas (rectangles, ellipses, etc.)
3. Right-click → verify "Auto-Layout" appears in the AI section
4. Click "Auto-Layout" → verify loading spinner appears
5. Verify ghost outlines appear at proposed positions with dashed blue borders
6. Verify movement lines connect current positions to proposed positions
7. Click "Apply Layout" → verify elements animate smoothly to new positions (~300ms)
8. Press Cmd+Z → verify all elements snap back to original positions (single undo step)

- [ ] **Step 3: Test cancel**

1. Trigger Auto-Layout → wait for preview
2. Click "Cancel" (or press Escape) → verify ghosts disappear, no changes applied

- [ ] **Step 4: Test edge cases**

1. Canvas with 1 element → verify "Auto-Layout" is hidden in context menu
2. Canvas with 0 elements → verify "Auto-Layout" is hidden
3. No API key set → verify settings panel opens with hint
4. Disconnect network → trigger layout → verify error message appears

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(ai): address issues found during auto-layout manual testing"
```
