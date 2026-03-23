# AI Auto-Layout Design

## Goal

AI analyzes the current canvas and suggests better positioning, spacing, and organization for existing elements. The user previews the suggested layout as ghost outlines and can apply or dismiss it.

## Architecture Overview

The feature adds a `layout` action to the existing AI pipeline. The flow: serialize elements with IDs → AI returns repositioned coordinates → ghost preview on a separate Konva layer → user applies or cancels → animated transition to new positions → single undo step.

## Type & Prompt Layer

### Type Change

Add `'layout'` to `AIActionType` in `packages/shared/src/types/ai.ts`:

```typescript
export type AIActionType = 'explain' | 'suggest' | 'summarize' | 'generate' | 'layout';
```

### Serialization

New function `serializeForLayout(elements: Element[]): string` in `packages/ai/src/serializer.ts`. Returns JSON (not human-readable text) so the AI can map responses back by ID:

```json
{
  "elements": [
    { "id": "abc123", "type": "rectangle", "x": 100, "y": 50, "width": 140, "height": 56, "text": "User Service", "groupId": null },
    { "id": "def456", "type": "arrow", "x": 240, "y": 78, "width": 40, "height": 2, "text": null, "groupId": null }
  ]
}
```

Same 50-element cap (`MAX_ELEMENTS`) applies. Bound arrows (those with `startBinding` or `endBinding`) are excluded from serialization since their positions are determined by the binding system.

### Prompt Template

Added to `packages/ai/src/prompts.ts` as the `layout` system prompt. Instructs the AI to:

- Accept the structured JSON element list
- Return `{ "layout": [{ "id": "...", "x": ..., "y": ... }] }` with improved positions
- Consider: alignment, even spacing, logical grouping, flow direction (left-to-right or top-to-bottom), no overlaps
- Only return position changes — no size modifications
- Preserve relative groupings (elements sharing a `groupId` stay together)
- Keep all positions within -5000..10000 range for both x and y

**Note:** The type change in `ai.ts` and the prompt addition in `prompts.ts` must be done atomically — `SYSTEM_PROMPTS` is typed as `Record<AIActionType, string>`, so adding `'layout'` to the type without the corresponding prompt entry causes a TypeScript error.

### Response Parser

New function `parseLayoutResponse(text: string, existingIds: string[])` in `packages/ai/src/parser.ts`:

- Strips markdown code fences and extracts JSON using its own extraction logic (the existing `extractJSON` helper has a fallback regex matching `"elements"` key, but layout responses use a `"layout"` key — so `parseLayoutResponse` needs a dedicated regex: `/\{[\s\S]*"layout"[\s\S]*\}/`)
- Validates: `layout` array present, each entry has `id` (string), `x` (number), `y` (number)
- Filters out entries with IDs not in `existingIds`
- Clamps positions to -5000..10000 (matching existing limits)
- Returns `{ positions: Array<{ id: string; x: number; y: number }>, warnings: string[] }`

## API Route

Reuses the existing SSE streaming pattern in `apps/web/src/app/api/ai/route.ts`. The `layout` action:

1. Receives scene via request body (same as other actions)
2. Calls `serializeForLayout(scene.elements)` to produce structured JSON
3. Calls `buildMessages('layout', serializedJson)` to build the prompt
4. Streams the response via SSE (same infrastructure as generate/explain/etc.)

The client accumulates the full streamed response, then parses with `parseLayoutResponse`. No new API pattern introduced.

**Important:** The `layout` action always operates on the entire canvas, not a selection subset. The request must be sent with `selectedIds` as `undefined` (not the current selection), ensuring all elements are serialized regardless of what the user has selected.

## Layout Preview UI

### Ghost Layer Architecture

The ghost preview renders as a separate `Konva.Layer` inside `FlowbaseCanvas`. Since `FlowbaseCanvas` owns the `<Stage>`, the ghost layer must be rendered within it — not from `CanvasEditor.tsx`.

**Approach:** `FlowbaseCanvas` accepts an optional `layoutPreview` prop. When provided, it renders an additional `<Layer>` above the main element layer containing the ghost shapes. This keeps all Konva rendering declarative and inside the component that owns the Stage.

### Component: `apps/web/src/components/ai/LayoutPreview.tsx`

Renders the Apply/Cancel controls (DOM overlay, not Konva). The ghost Konva shapes are rendered by `FlowbaseCanvas` based on the preview prop.

**Ghost shapes** (rendered inside `FlowbaseCanvas`): For each element in the AI response:

- Render a simplified shape clone at the proposed `(x, y)` position
- Same `width`, `height`, and `type` as the original
- Styled: dashed stroke (`dash: [6, 4]`), 30% opacity, no fill, blue color (`#228BE6`)
- Text elements show their text content for identification
- Thin dotted lines from each element's current center to its proposed center (shows movement direction and distance)

**Apply/Cancel bar** (rendered by `LayoutPreview.tsx` as DOM overlay): Floating toolbar anchored at bottom-center of the viewport:

- "Apply Layout" button (primary style)
- "Cancel" button (secondary style)
- Escape key triggers Cancel

**State management:** Local component state in `CanvasEditor.tsx`:

```typescript
layoutPreview: { positions: Array<{ id: string; x: number; y: number }> } | null
```

When non-null, the preview prop is passed to `FlowbaseCanvas` and the `LayoutPreview` DOM overlay renders. No global store changes.

## Animation

**On Apply:**

- State-driven animation using `requestAnimationFrame`. On apply, set an `isAnimating` flag and interpolate element positions from current to target over ~300ms using ease-out easing. Each frame, compute interpolated positions and update the store via `setElements()`. This avoids conflicts between imperative Konva tweens and React-Konva's declarative rendering model.
- `pushHistory()` is called once at the start (capturing pre-animation positions). The final `setElements()` call at animation end sets the target positions.
- During animation, `isAnimating` flag disables user interaction (pointer events, tool switching).

**On Cancel:**

- Ghost layer removed instantly, no animation

**On Undo:**

- Instant snap-back (no reverse animation, per spec scope exclusions)

## UI Triggers

**Context menu** (`ContextMenu.tsx`):

- Add "Auto-Layout" to the AI section (Sparkles icon, blue text, matching other AI actions)
- Visible when canvas has >= 2 elements. Add an `elementCount` prop to `ContextMenu` (passed from `CanvasEditor` which has access to the elements array). The menu item uses a new visibility condition based on this count.
- Action type `'layout'` added to `ContextMenuAction`

**CanvasEditor.tsx wiring:**

- `handleContextMenuAction` gets `case 'layout'`
- The layout action does **not** use `runAIAction`/`streamToPopover` (those stream text into AI popovers). Instead, it has its own dedicated flow:
  1. Set `isLayoutLoading: true`
  2. Serialize all elements via `serializeForLayout()` (no `selectedIds`)
  3. Call AI via the existing SSE streaming endpoint
  4. Accumulate the full streamed response into a string buffer (no popover)
  5. Parse with `parseLayoutResponse()`
  6. Set `layoutPreview` state with parsed positions
  7. Set `isLayoutLoading: false`
- Loading indicator: non-modal floating indicator ("Analyzing layout...") so canvas stays visible. This is a simple new DOM element, not reusing the popover system.
- On parse failure or zero valid positions: error toast, clear loading state

**No toolbar button** — context menu is sufficient. Spec allows "and/or".

## Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| AI returns IDs not in current elements | Silently skipped |
| Positions outside bounds | Clamped to -5000..10000 |
| Fewer elements returned than on canvas | Apply partial layout (elements not mentioned stay in place) |
| Zero valid positions after filtering | Error toast, no preview |
| Canvas has >50 elements | First 50 serialized and repositioned; rest stay in place |
| Canvas has <2 elements | Context menu item hidden |
| User cancels during loading (Escape or right-click) | Cancel in-flight request, reset loading state |
| Preview already showing + new layout triggered | Dismiss current preview first |
| Bound arrows (with startBinding/endBinding) | Excluded from serialization and AI response; they follow their bound shapes automatically via the existing binding system |
| Unbound arrows/lines | Repositioned by AI like any element |

## Undo Integration

- Single `pushHistory()` call before applying positions
- Single `setElements()` call with all new positions
- Results in one undo step for the entire layout operation

## Scope Exclusions

- AI suggesting size changes
- AI suggesting new elements
- Multiple layout algorithm options
- Layout for selected subsets only
- Animated undo (undo snaps back instantly)

## Key Files

| File | Change |
|---|---|
| `packages/shared/src/types/ai.ts` | Add `'layout'` to `AIActionType` |
| `packages/ai/src/prompts.ts` | Layout prompt template |
| `packages/ai/src/serializer.ts` | `serializeForLayout()` function |
| `packages/ai/src/parser.ts` | `parseLayoutResponse()` function |
| `apps/web/src/app/api/ai/route.ts` | Handle `'layout'` action |
| `apps/web/src/components/ai/LayoutPreview.tsx` | Apply/Cancel bar DOM overlay (new file) |
| `packages/canvas/src/components/FlowbaseCanvas.tsx` | Accept `layoutPreview` prop, render ghost layer |
| `apps/web/src/components/canvas/CanvasEditor.tsx` | Wire layout action, manage preview state, layout streaming flow |
| `apps/web/src/components/canvas/ContextMenu.tsx` | Add "Auto-Layout" menu item, accept `elementCount` prop |
