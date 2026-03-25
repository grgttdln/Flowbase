# Canvas Performance Optimization Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Flowbase's canvas feels sluggish even with fewer than 20 elements. The root cause is cascading React re-renders — nearly any interaction (drag, pan, select, draw) triggers a full re-render of the entire canvas component tree. This spec defines targeted memoization and store subscription fixes to eliminate unnecessary re-renders without restructuring the architecture.

**Goal:** Smooth, responsive canvas interactions (drag, pan, zoom, select, draw) with no perceptible lag at typical element counts (<100).

---

## Root Cause Analysis

### 1. Monolithic Zustand subscriptions
`FlowbaseCanvas` destructures ~20 values from `useCanvasStore()` in a single call. Zustand returns a new object each time, so any store change — viewport, selection, tool, elements — re-renders the entire canvas.

### 2. Unstable callback references
Callbacks like `handleDragMove`, `handleSelect`, and `handleDragStart` include `elements` in their `useCallback` dependency arrays. Since `elements` is a new array reference on every update, these callbacks are recreated on every element change, defeating `React.memo` on `ShapeRenderer`.

### 3. Per-render sorting
`const sortedElements = [...elements].sort(...)` on line 589 of `FlowbaseCanvas.tsx` copies and sorts the array on every render, even when elements haven't changed.

### 4. Unmemoized shape components
`ShapeRenderer` is wrapped in `React.memo`, but the individual shape components (`RectShape`, `EllipseShape`, etc.) are not. Fresh `() => {}` callbacks are also passed to the drawing element's `ShapeRenderer` on every render.

### 5. Per-frame waste during drag-select
During selection box dragging, `select(ids)` is called on every mouse move frame, creating a new `Set` even when the matched elements haven't changed.

### 6. Multiple state updates during grouped drag
`handleDragMove` calls `updateElement` once per grouped element and once per bound arrow. Each call creates a new `elements` array. A group of 5 shapes with 4 arrows = 10 state updates per mouse move frame.

### 7. SelectionLayer over-subscribes
`SelectionLayer` subscribes to the full store including `elements`, causing the Transformer to reconfigure on any element change rather than only on selection changes.

---

## Design

### Fix 1: Split Zustand Store Selectors

**Files:** `FlowbaseCanvas.tsx`, `SelectionLayer.tsx`, `CanvasEditor.tsx`

Replace monolithic destructuring with individual selectors:

```ts
// Before
const { elements, selectedIds, activeTool, viewport, ... } = useCanvasStore();

// After
const elements = useCanvasStore(s => s.elements);
const selectedIds = useCanvasStore(s => s.selectedIds);
const activeTool = useCanvasStore(s => s.activeTool);
const viewport = useCanvasStore(s => s.viewport);
```

Zustand uses `Object.is` comparison per selector, so components only re-render when their specific slice changes.

---

### Fix 2: Memoize `sortedElements`

**File:** `FlowbaseCanvas.tsx`

```ts
// Before
const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

// After
const sortedElements = useMemo(
  () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
  [elements]
);
```

---

### Fix 3: Stabilize Callback References with `useRef`

**File:** `FlowbaseCanvas.tsx`

Store `elements` in a ref and read from it inside callbacks, removing `elements` from dependency arrays:

```ts
const elementsRef = useRef(elements);
elementsRef.current = elements;

const handleDragMove = useCallback((id: string, x: number, y: number) => {
  const element = elementsRef.current.find((el) => el.id === id);
  // ... rest uses elementsRef.current instead of elements
}, [updateElement, snapGridEnabled, snapElementsEnabled, gridSize]);
```

Applies to: `handleDragMove`, `handleDragStart`, `handleSelect`, `handleTextDblClick`, `handleEndpointDragMove`, `handleEndpointDragEnd`, `handleSegmentDblClick`.

---

### Fix 4: Memoize Individual Shape Components

**Files:** `RectShape.tsx`, `EllipseShape.tsx`, `DiamondShape.tsx`, `TextShape.tsx`, `LineShape.tsx`, `ArrowShape.tsx`, `FreehandShape.tsx`

Wrap each in `React.memo`:

```ts
const RectShape = React.memo(({ element, isSelected, ... }: RectShapeProps) => {
  // existing code
});
RectShape.displayName = 'RectShape';
```

**File:** `FlowbaseCanvas.tsx`

Hoist no-op callbacks to module-level constants for the drawing element:

```ts
const NOOP = () => {};
const NOOP_SELECT = (_id: string, _shift: boolean) => {};

// In render:
{drawingElement && (
  <ShapeRenderer
    element={drawingElement}
    isSelected={false}
    onSelect={NOOP_SELECT}
    onDragStart={NOOP}
    onDragMove={NOOP}
    onDragEnd={NOOP}
    onTextDblClick={NOOP}
  />
)}
```

---

### Fix 5: Deduplicate `select()` During Drag-Select

**File:** `FlowbaseCanvas.tsx`

Only call `select()` when the matched ID set actually changes:

```ts
const prevSelectionRef = useRef<string[]>([]);

// Inside handleStageMouseMove, selection box branch:
const ids = elements.filter(/* ... */).map((el) => el.id);
const prev = prevSelectionRef.current;
if (ids.length !== prev.length || ids.some((id, i) => id !== prev[i])) {
  prevSelectionRef.current = ids;
  select(ids);
}
```

Reset `prevSelectionRef` when `selectionBox` is cleared in `handleStageMouseUp`.

---

### Fix 6: Batch Grouped Drag Updates

**File:** `useCanvasStore.ts`

Add a `batchUpdateElements` method:

```ts
batchUpdateElements: (updates: Map<string, Partial<Element>>) => {
  set({
    elements: get().elements.map((el) => {
      const u = updates.get(el.id);
      return u ? { ...el, ...u } : el;
    }),
  });
},
```

**File:** `FlowbaseCanvas.tsx`

Refactor `handleDragMove` to collect all updates (snapped position, grouped siblings, bound arrows) into a single `Map<string, Partial<Element>>`, then call `batchUpdateElements` once.

---

### Fix 7: Fix SelectionLayer Re-renders

**File:** `SelectionLayer.tsx`

Split selectors and memoize the line/arrow ID set:

```ts
const selectedIds = useCanvasStore(s => s.selectedIds);
const elements = useCanvasStore(s => s.elements);
const updateElement = useCanvasStore(s => s.updateElement);

const lineArrowIds = useMemo(
  () => new Set(elements.filter(el => el.type === 'line' || el.type === 'arrow').map(el => el.id)),
  [elements]
);
```

Update the `useEffect` dependency array to `[selectedIds, lineArrowIds, stageRef]` instead of `[selectedIds, elements, stageRef]`.

---

## Files Changed

| File | Changes |
|------|---------|
| `packages/canvas/src/components/FlowbaseCanvas.tsx` | Split selectors, memoize sortedElements, stabilize callbacks via refs, deduplicate drag-select, batch grouped drag, hoist no-op callbacks |
| `packages/canvas/src/store/useCanvasStore.ts` | Add `batchUpdateElements` method |
| `packages/canvas/src/components/SelectionLayer.tsx` | Split selectors, memoize lineArrowIds, tighten useEffect deps |
| `packages/canvas/src/components/shapes/RectShape.tsx` | Wrap in `React.memo` |
| `packages/canvas/src/components/shapes/EllipseShape.tsx` | Wrap in `React.memo` |
| `packages/canvas/src/components/shapes/DiamondShape.tsx` | Wrap in `React.memo` |
| `packages/canvas/src/components/shapes/TextShape.tsx` | Wrap in `React.memo` |
| `packages/canvas/src/components/shapes/LineShape.tsx` | Wrap in `React.memo` |
| `packages/canvas/src/components/shapes/ArrowShape.tsx` | Wrap in `React.memo` |
| `packages/canvas/src/components/shapes/FreehandShape.tsx` | Wrap in `React.memo` |
| `apps/web/src/components/canvas/CanvasEditor.tsx` | Split Zustand selectors |

---

## Testing Strategy

- **Manual testing:** Verify drag, pan, zoom, select, draw, group drag, undo/redo, and connector behavior all work correctly after changes.
- **Performance verification:** Use React DevTools Profiler to confirm re-render counts are reduced — dragging one shape should not re-render other shapes.
- **Regression check:** Auto-save, AI actions, layout preview, export should all continue working since no public APIs change.

---

## What's NOT in This Spec

- Konva-native drag path (Approach B follow-up)
- Viewport culling / spatial indexing (Approach C, only needed at 100+ elements)
- Web Worker offloading
- Canvas rendering optimizations (off-screen grid, layer caching)
