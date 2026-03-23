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

Same 50-element cap (`MAX_ELEMENTS`) applies.

### Prompt Template

Added to `packages/ai/src/prompts.ts` as the `layout` system prompt. Instructs the AI to:

- Accept the structured JSON element list
- Return `{ "layout": [{ "id": "...", "x": ..., "y": ... }] }` with improved positions
- Consider: alignment, even spacing, logical grouping, flow direction (left-to-right or top-to-bottom), no overlaps
- Only return position changes — no size modifications
- Preserve relative groupings (elements sharing a `groupId` stay together)

### Response Parser

New function `parseLayoutResponse(text: string, existingIds: string[])` in `packages/ai/src/parser.ts`:

- Strips markdown code fences (reuses existing extraction logic)
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

## Layout Preview UI

### Component: `apps/web/src/components/ai/LayoutPreview.tsx`

Renders the ghost overlay and Apply/Cancel controls.

**Ghost layer:** A separate `Konva.Layer` on top of the main canvas layer. For each element in the AI response:

- Render a simplified shape clone at the proposed `(x, y)` position
- Same `width`, `height`, and `type` as the original
- Styled: dashed stroke (`dash: [6, 4]`), 30% opacity, no fill, blue color (`#228BE6`)
- Text elements show their text content for identification
- Thin dotted lines from each element's current center to its proposed center (shows movement direction and distance)

**Apply/Cancel bar:** A floating DOM toolbar anchored at bottom-center of the viewport:

- "Apply Layout" button (primary style)
- "Cancel" button (secondary style)
- Escape key triggers Cancel

**State management:** Local component state in `CanvasEditor.tsx`:

```typescript
layoutPreview: { positions: Array<{ id: string; x: number; y: number }> } | null
```

When non-null, the `LayoutPreview` component renders. No global store changes.

## Animation

**On Apply:**

- Use Konva's `node.to()` tween: `node.to({ x, y, duration: 0.3, easing: Konva.Easings.EaseOut })`
- After all tweens complete (~300ms), perform the store update: `pushHistory()` then `setElements()` with final positions
- During animation, set `isAnimating` flag to disable user interaction

**On Cancel:**

- Ghost layer removed instantly, no animation

**On Undo:**

- Instant snap-back (no reverse animation, per spec scope exclusions)

## UI Triggers

**Context menu** (`ContextMenu.tsx`):

- Add "Auto-Layout" to the AI section (Sparkles icon, blue text, matching other AI actions)
- Visible when canvas has >= 2 elements
- Action type `'layout'` added to `ContextMenuAction`

**CanvasEditor.tsx wiring:**

- `handleContextMenuAction` gets `case 'layout'`
- Flow: set loading → serialize → stream AI call → accumulate → parse → set `layoutPreview` → clear loading
- Loading indicator: non-modal floating indicator ("Analyzing layout...") so canvas stays visible
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
| Arrows with bindings | Follow their bound shapes automatically via existing binding system |
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
| `apps/web/src/components/ai/LayoutPreview.tsx` | Ghost overlay + Apply/Cancel bar (new file) |
| `apps/web/src/components/canvas/CanvasEditor.tsx` | Wire layout action, manage preview state |
| `apps/web/src/components/canvas/ContextMenu.tsx` | Add "Auto-Layout" menu item |
