# Canvas Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate cascading React re-renders that cause general sluggishness on the Flowbase canvas, even with fewer than 20 elements.

**Architecture:** Pure refactor — no new features, no API changes, no structural rework. Fix Zustand subscription patterns, stabilize callback references, memoize components, and batch state updates. All changes are internal to existing files.

**Tech Stack:** React 19, Zustand, react-konva, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-25-canvas-performance-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/canvas/src/store/useCanvasStore.ts` | Modify | Add `batchUpdateElements` method |
| `packages/canvas/src/components/FlowbaseCanvas.tsx` | Modify | Split selectors, stabilize callbacks, memoize sortedElements, batch drag, deduplicate select, hoist no-ops |
| `packages/canvas/src/components/SelectionLayer.tsx` | Modify | Split selectors, memoize lineArrowIds |
| `packages/canvas/src/components/shapes/RectShape.tsx` | Modify | Wrap in React.memo |
| `packages/canvas/src/components/shapes/EllipseShape.tsx` | Modify | Wrap in React.memo |
| `packages/canvas/src/components/shapes/DiamondShape.tsx` | Modify | Wrap in React.memo |
| `packages/canvas/src/components/shapes/TextShape.tsx` | Modify | Wrap in React.memo |
| `packages/canvas/src/components/shapes/LineShape.tsx` | Modify | Wrap in React.memo |
| `packages/canvas/src/components/shapes/ArrowShape.tsx` | Modify | Wrap in React.memo |
| `packages/canvas/src/components/shapes/FreehandShape.tsx` | Modify | Wrap in React.memo |
| `apps/web/src/components/canvas/CanvasEditor.tsx` | Modify | Split selectors |

---

### Task 1: Add `batchUpdateElements` to Zustand Store

This must be done first because Task 4 (batch grouped drag) depends on it.

**Files:**
- Modify: `packages/canvas/src/store/useCanvasStore.ts:6-11` (CanvasState interface) and `:78-96` (store implementation)

- [ ] **Step 1: Add `batchUpdateElements` to the `CanvasState` interface**

In `packages/canvas/src/store/useCanvasStore.ts`, add to the interface after line 11 (`setElements`):

```ts
batchUpdateElements: (updates: Map<string, Partial<Element>>) => void;
```

- [ ] **Step 2: Implement `batchUpdateElements` in the store**

Add the implementation after the `setElements` method (after line 127):

```ts
batchUpdateElements: (updates) => {
  set({
    elements: get().elements.map((el) => {
      const u = updates.get(el.id);
      return u ? { ...el, ...u } : el;
    }),
  });
},
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add packages/canvas/src/store/useCanvasStore.ts
git commit -m "perf(canvas): add batchUpdateElements to store for grouped updates"
```

---

### Task 2: Wrap All Shape Components in `React.memo`

Independent of other tasks — no dependencies.

**Files:**
- Modify: `packages/canvas/src/components/shapes/RectShape.tsx`
- Modify: `packages/canvas/src/components/shapes/EllipseShape.tsx`
- Modify: `packages/canvas/src/components/shapes/DiamondShape.tsx`
- Modify: `packages/canvas/src/components/shapes/TextShape.tsx`
- Modify: `packages/canvas/src/components/shapes/LineShape.tsx`
- Modify: `packages/canvas/src/components/shapes/ArrowShape.tsx`
- Modify: `packages/canvas/src/components/shapes/FreehandShape.tsx`

- [ ] **Step 1: Wrap `RectShape` in `React.memo`**

In `packages/canvas/src/components/shapes/RectShape.tsx`:
- Add `import React from 'react';` at top
- Change `const RectShape = (` to `const RectShape = React.memo((`
- Add `));` to close the memo wrapper after the component's closing `};` (before `export`)
- Add `RectShape.displayName = 'RectShape';` before the export

The file should look like:

```tsx
import { Group, Rect, Text } from 'react-konva';
import type { Element } from '@flowbase/shared';
import React from 'react';

interface RectShapeProps {
  element: Element;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onDblClick?: (id: string) => void;
}

const RectShape = React.memo(({ element, isSelected, onSelect, onDragStart, onDragMove, onDragEnd, onDblClick }: RectShapeProps) => {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={(e) => onSelect(element.id, e.evt.shiftKey)}
      onTap={(e) => onSelect(element.id, false)}
      onDblClick={() => onDblClick?.(element.id)}
      onDblTap={() => onDblClick?.(element.id)}
      onDragStart={() => onDragStart(element.id)}
      onDragMove={(e) => onDragMove(element.id, e.target.x(), e.target.y())}
      onDragEnd={() => onDragEnd(element.id)}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={element.fill}
        stroke={isSelected ? '#007AFF' : element.stroke}
        strokeWidth={element.strokeWidth}
        cornerRadius={4}
      />
      {element.text && (
        <Text
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          text={element.text}
          fontSize={element.fontSize ?? 14}
          fill={element.stroke}
          align="center"
          verticalAlign="middle"
          listening={false}
          padding={4}
        />
      )}
    </Group>
  );
});

RectShape.displayName = 'RectShape';

export default RectShape;
```

- [ ] **Step 2: Wrap `EllipseShape` in `React.memo`**

Same pattern in `packages/canvas/src/components/shapes/EllipseShape.tsx`:
- Add `import React from 'react';`
- Wrap component: `const EllipseShape = React.memo(( ... ) => { ... });`
- Add `EllipseShape.displayName = 'EllipseShape';`

- [ ] **Step 3: Wrap `DiamondShape` in `React.memo`**

Same pattern in `packages/canvas/src/components/shapes/DiamondShape.tsx`:
- Add `import React from 'react';`
- Wrap component: `const DiamondShape = React.memo(( ... ) => { ... });`
- Add `DiamondShape.displayName = 'DiamondShape';`

- [ ] **Step 4: Wrap `TextShape` in `React.memo`**

Same pattern in `packages/canvas/src/components/shapes/TextShape.tsx`:
- Add `import React from 'react';`
- Wrap component: `const TextShape = React.memo(( ... ) => { ... });`
- Add `TextShape.displayName = 'TextShape';`

- [ ] **Step 5: Wrap `LineShape` in `React.memo`**

Same pattern in `packages/canvas/src/components/shapes/LineShape.tsx`:
- Add `import React from 'react';`
- Wrap component: `const LineShape = React.memo(( ... ) => { ... });`
- Add `LineShape.displayName = 'LineShape';`

- [ ] **Step 6: Wrap `ArrowShape` in `React.memo`**

Same pattern in `packages/canvas/src/components/shapes/ArrowShape.tsx`:
- Add `import React from 'react';`
- Wrap component: `const ArrowShape = React.memo(( ... ) => { ... });`
- Add `ArrowShape.displayName = 'ArrowShape';`

- [ ] **Step 7: Wrap `FreehandShape` in `React.memo`**

Same pattern in `packages/canvas/src/components/shapes/FreehandShape.tsx`:
- Add `import React from 'react';`
- Wrap component: `const FreehandShape = React.memo(( ... ) => { ... });`
- Add `FreehandShape.displayName = 'FreehandShape';`

- [ ] **Step 8: Verify build**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add packages/canvas/src/components/shapes/
git commit -m "perf(canvas): wrap all shape components in React.memo"
```

---

### Task 3: Split Zustand Selectors in FlowbaseCanvas

This is the highest-impact change. Must be done before Task 4 (which modifies the same file).

**Files:**
- Modify: `packages/canvas/src/components/FlowbaseCanvas.tsx:36-63`

- [ ] **Step 1: Replace monolithic store destructure with individual selectors**

In `packages/canvas/src/components/FlowbaseCanvas.tsx`, replace lines 36-63:

```ts
const {
  elements,
  selectedIds,
  activeTool,
  viewport,
  drawingElement,
  snapToGrid: snapGridEnabled,
  snapToElements: snapElementsEnabled,
  gridSize,
  select,
  toggleSelection,
  deselect,
  updateElement,
  deleteElements,
  copy,
  paste,
  undo,
  redo,
  group,
  ungroup,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  pushHistory,
  setViewport,
  zoomTo,
} = useCanvasStore();
```

With individual selectors:

```ts
const elements = useCanvasStore((s) => s.elements);
const selectedIds = useCanvasStore((s) => s.selectedIds);
const activeTool = useCanvasStore((s) => s.activeTool);
const viewport = useCanvasStore((s) => s.viewport);
const drawingElement = useCanvasStore((s) => s.drawingElement);
const snapGridEnabled = useCanvasStore((s) => s.snapToGrid);
const snapElementsEnabled = useCanvasStore((s) => s.snapToElements);
const gridSize = useCanvasStore((s) => s.gridSize);
const select = useCanvasStore((s) => s.select);
const toggleSelection = useCanvasStore((s) => s.toggleSelection);
const deselect = useCanvasStore((s) => s.deselect);
const updateElement = useCanvasStore((s) => s.updateElement);
const batchUpdateElements = useCanvasStore((s) => s.batchUpdateElements);
const deleteElements = useCanvasStore((s) => s.deleteElements);
const copy = useCanvasStore((s) => s.copy);
const paste = useCanvasStore((s) => s.paste);
const undo = useCanvasStore((s) => s.undo);
const redo = useCanvasStore((s) => s.redo);
const group = useCanvasStore((s) => s.group);
const ungroup = useCanvasStore((s) => s.ungroup);
const bringForward = useCanvasStore((s) => s.bringForward);
const sendBackward = useCanvasStore((s) => s.sendBackward);
const bringToFront = useCanvasStore((s) => s.bringToFront);
const sendToBack = useCanvasStore((s) => s.sendToBack);
const pushHistory = useCanvasStore((s) => s.pushHistory);
const setViewport = useCanvasStore((s) => s.setViewport);
const zoomTo = useCanvasStore((s) => s.zoomTo);
```

Note: also pull `batchUpdateElements` — needed for Task 4.

- [ ] **Step 2: Verify build**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add packages/canvas/src/components/FlowbaseCanvas.tsx
git commit -m "perf(canvas): split Zustand selectors in FlowbaseCanvas"
```

---

### Task 4: Stabilize Callbacks, Memoize Sort, Batch Drag, Deduplicate Select, Hoist No-Ops

This is the largest task — all changes are in `FlowbaseCanvas.tsx` and interdependent, so they're grouped.

**Files:**
- Modify: `packages/canvas/src/components/FlowbaseCanvas.tsx`

- [ ] **Step 1: Add `useMemo` to imports and create `elementsRef`**

At the top of the component (after the selector block from Task 3), add:

```ts
const elementsRef = useRef(elements);
elementsRef.current = elements;
```

Add `useMemo` to the React import on line 2:

```ts
import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
```

- [ ] **Step 2: Memoize `sortedElements`**

Replace line 589:

```ts
const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
```

With:

```ts
const sortedElements = useMemo(
  () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
  [elements]
);
```

- [ ] **Step 3: Stabilize `handleSelect` callback**

Replace the existing `handleSelect` (lines 324-338):

```ts
const handleSelect = useCallback((id: string, shiftKey: boolean) => {
  if (activeTool !== 'select') return;
  if (shiftKey) {
    toggleSelection(id);
  } else {
    const el = elementsRef.current.find((e) => e.id === id);
    if (el?.groupId) {
      const groupIds = elementsRef.current.filter((e) => e.groupId === el.groupId).map((e) => e.id);
      select(groupIds);
    } else {
      select([id]);
    }
  }
}, [activeTool, select, toggleSelection]);
```

Note: `elements` removed from dependencies, uses `elementsRef.current` instead.

- [ ] **Step 4: Stabilize `handleDragStart` callback**

Replace the existing `handleDragStart` (lines 340-354):

```ts
const handleDragStart = useCallback((id: string) => {
  if (!dragStarted.current) {
    pushHistory();
    dragStarted.current = true;
  }
  if (!selectedIds.has(id)) {
    const el = elementsRef.current.find((e) => e.id === id);
    if (el?.groupId) {
      const groupIds = elementsRef.current.filter((e) => e.groupId === el.groupId).map((e) => e.id);
      select(groupIds);
    } else {
      select([id]);
    }
  }
}, [selectedIds, select, pushHistory]);
```

- [ ] **Step 5: Stabilize and batch `handleDragMove` callback**

Replace the existing `handleDragMove` (lines 356-403) with a version that uses `elementsRef.current` and `batchUpdateElements`:

```ts
const handleDragMove = useCallback((id: string, x: number, y: number) => {
  const elements = elementsRef.current;
  const element = elements.find((el) => el.id === id);
  if (!element) return;

  const result = snapPosition(
    x, y, element.width, element.height,
    elements, id,
    { snapToGrid: snapGridEnabled, snapToElements: snapElementsEnabled, gridSize },
  );

  setActiveGuides(result.guides);

  const updates = new Map<string, Partial<Element>>();
  updates.set(id, { x: result.x, y: result.y });

  // Move grouped elements together
  if (element.groupId) {
    const dx = result.x - element.x;
    const dy = result.y - element.y;
    elements
      .filter((el) => el.groupId === element.groupId && el.id !== id)
      .forEach((el) => updates.set(el.id, { x: el.x + dx, y: el.y + dy }));
  }

  // Update all arrows bound to moved elements
  const movedIds = new Set([id]);
  if (element.groupId) {
    elements.filter((el) => el.groupId === element.groupId).forEach((el) => movedIds.add(el.id));
  }

  // Build updated elements list with new positions for recalculation
  const updatedElements = elements.map((el) => {
    const u = updates.get(el.id);
    return u ? { ...el, ...u } : el;
  });

  for (const el of elements) {
    if (el.type !== 'line' && el.type !== 'arrow') continue;
    const startBound = el.startBinding && movedIds.has(el.startBinding.elementId);
    const endBound = el.endBinding && movedIds.has(el.endBinding.elementId);
    if (startBound || endBound) {
      const arrowUpdates = recalcBoundArrow(el, updatedElements);
      if (arrowUpdates) updates.set(el.id, { ...updates.get(el.id), ...arrowUpdates });
    }
  }

  batchUpdateElements(updates);
}, [snapGridEnabled, snapElementsEnabled, gridSize, batchUpdateElements]);
```

Note: `elements` and `updateElement` removed from dependencies. Single `batchUpdateElements` call instead of N `updateElement` calls.

- [ ] **Step 6: Stabilize `handleTextDblClick` callback**

Replace the existing `handleTextDblClick` (lines 410-465). Change `elements.find` to `elementsRef.current.find` and remove `elements` from the dependency array:

```ts
const handleTextDblClick = useCallback((id: string) => {
  const element = elementsRef.current.find((el) => el.id === id);
  if (!element) return;
  const editableTypes = ['text', 'rectangle', 'ellipse', 'diamond'];
  if (!editableTypes.includes(element.type)) return;

  setEditingTextId(id);

  const stage = stageRef.current;
  if (!stage) return;

  const node = stage.findOne(`#${id}`);
  if (!node) return;

  const nodeRect = node.getClientRect();
  const input = document.createElement('textarea');
  input.value = element.text ?? '';
  input.style.position = 'absolute';
  input.style.top = `${nodeRect.y}px`;
  input.style.left = `${nodeRect.x}px`;
  input.style.width = `${Math.max(nodeRect.width, 100)}px`;
  input.style.height = `${Math.max(nodeRect.height, 30)}px`;
  input.style.fontSize = `${(element.fontSize ?? (element.type === 'text' ? 16 : 14)) * viewport.zoom}px`;
  input.style.textAlign = element.type === 'text' ? 'left' : 'center';
  input.style.border = '2px solid #007AFF';
  input.style.borderRadius = '4px';
  input.style.padding = '2px 4px';
  input.style.outline = 'none';
  input.style.resize = 'none';
  input.style.background = 'white';
  input.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
  input.style.zIndex = '1000';

  const container = stage.container().parentElement;
  if (container) {
    container.style.position = 'relative';
    container.appendChild(input);
  }

  input.focus();
  input.select();

  const handleBlur = () => {
    pushHistory();
    updateElement(id, { text: input.value });
    input.remove();
    setEditingTextId(null);
  };

  input.addEventListener('blur', handleBlur);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
      input.blur();
    }
  });
}, [viewport.zoom, updateElement, pushHistory]);
```

- [ ] **Step 7: Stabilize endpoint drag callbacks**

In `handleEndpointDragStart` (lines 468-477), change `elements.find` to `elementsRef.current.find` and remove `elements` from deps:

```ts
const handleEndpointDragStart = useCallback((elementId: string, pointIndex: number) => {
  pushHistory();
  const el = elementsRef.current.find((e) => e.id === elementId);
  if (!el) return;
  const pts = el.points ?? [0, 0, el.width, el.height];
  const absX = el.x + (pts[pointIndex * 2] ?? 0);
  const absY = el.y + (pts[pointIndex * 2 + 1] ?? 0);
  setDraggingEndpoint({ elementId, pointIndex, x: absX, y: absY });
  endpointAnchor.current = null;
}, [pushHistory]);
```

In `handleEndpointDragMove` (lines 479-522), change `elements` references to `elementsRef.current` and remove `elements` from deps:

```ts
const handleEndpointDragMove = useCallback((elementId: string, pointIndex: number, x: number, y: number) => {
  const elements = elementsRef.current;
  const el = elements.find((e) => e.id === elementId);
  if (!el) return;

  const pts = el.points ? [...el.points] : [0, 0, el.width, el.height];
  const totalPoints = pts.length / 2;
  const isStart = pointIndex === 0;
  const isEnd = pointIndex === totalPoints - 1;

  let snapX = x;
  let snapY = y;
  if (isStart || isEnd) {
    const anchor = findNearestAnchor(x, y, elements, elementId);
    endpointAnchor.current = anchor;
    if (anchor) {
      snapX = anchor.x;
      snapY = anchor.y;
    }
  }

  setDraggingEndpoint({ elementId, pointIndex, x: snapX, y: snapY });

  if (isStart) {
    const dx = snapX - el.x;
    const dy = snapY - el.y;
    const newPts = [...pts];
    for (let i = 2; i < newPts.length; i += 2) {
      newPts[i] -= dx;
      newPts[i + 1] -= dy;
    }
    newPts[0] = 0;
    newPts[1] = 0;
    updateElement(elementId, { x: snapX, y: snapY, points: newPts });
  } else {
    const newPts = [...pts];
    newPts[pointIndex * 2] = snapX - el.x;
    newPts[pointIndex * 2 + 1] = snapY - el.y;
    updateElement(elementId, { points: newPts });
  }
}, [updateElement]);
```

In `handleEndpointDragEnd` (lines 524-551), same pattern:

```ts
const handleEndpointDragEnd = useCallback((elementId: string, pointIndex: number) => {
  const el = elementsRef.current.find((e) => e.id === elementId);
  if (!el) return;

  const pts = el.points ?? [0, 0, el.width, el.height];
  const totalPoints = pts.length / 2;
  const isStart = pointIndex === 0;
  const isEnd = pointIndex === totalPoints - 1;

  if (isStart || isEnd) {
    const anchor = endpointAnchor.current;
    const bindingUpdate: Partial<Element> = {};
    if (isStart) {
      bindingUpdate.startBinding = anchor
        ? { elementId: anchor.elementId, anchor: anchor.anchor }
        : undefined;
    } else {
      bindingUpdate.endBinding = anchor
        ? { elementId: anchor.elementId, anchor: anchor.anchor }
        : undefined;
    }
    updateElement(elementId, bindingUpdate);
  }

  setDraggingEndpoint(null);
  endpointAnchor.current = null;
}, [updateElement]);
```

In `handleSegmentDblClick` (lines 553-565), same pattern:

```ts
const handleSegmentDblClick = useCallback((elementId: string, segmentIndex: number, x: number, y: number) => {
  const el = elementsRef.current.find((e) => e.id === elementId);
  if (!el) return;

  pushHistory();
  const pts = el.points ? [...el.points] : [0, 0, el.width, el.height];
  const insertAt = (segmentIndex + 1) * 2;
  const relX = x - el.x;
  const relY = y - el.y;
  pts.splice(insertAt, 0, relX, relY);
  updateElement(elementId, { points: pts, autoRoute: false });
}, [updateElement, pushHistory]);
```

- [ ] **Step 8: Deduplicate `select()` during drag-select**

Add a ref after the existing `dragStarted` ref (around line 76):

```ts
const prevDragSelectIds = useRef<string[]>([]);
```

In `handleStageMouseMove`, replace the selection box branch (lines 229-245) with:

```ts
if (selectionBox && activeTool === 'select') {
  const pos = getCanvasPos(e);
  const x = Math.min(selectionBox.startX, pos.x);
  const y = Math.min(selectionBox.startY, pos.y);
  const w = Math.abs(pos.x - selectionBox.startX);
  const h = Math.abs(pos.y - selectionBox.startY);
  setSelectionBox({ ...selectionBox, x, y, width: w, height: h });

  const ids = elementsRef.current
    .filter((el) => {
      return el.x >= x && el.y >= y && el.x + el.width <= x + w && el.y + el.height <= y + h;
    })
    .map((el) => el.id);

  const prev = prevDragSelectIds.current;
  if (ids.length !== prev.length || ids.some((id, i) => id !== prev[i])) {
    prevDragSelectIds.current = ids;
    select(ids);
  }
  return;
}
```

In `handleStageMouseUp`, after the `if (selectionBox)` block (around line 265), add a reset:

```ts
if (selectionBox) {
  setSelectionBox(null);
  prevDragSelectIds.current = [];
  return;
}
```

- [ ] **Step 9: Hoist no-op callbacks to module level**

Before the component definition (before line 33), add module-level constants:

```ts
const NOOP = () => {};
const NOOP_SELECT = (_id: string, _shift: boolean) => {};
const NOOP_DRAG_MOVE = (_id: string, _x: number, _y: number) => {};
const NOOP_DRAG = (_id: string) => {};
```

Replace the drawing element's ShapeRenderer (lines 630-639):

```tsx
{drawingElement && (
  <ShapeRenderer
    element={drawingElement}
    isSelected={false}
    onSelect={NOOP_SELECT}
    onDragStart={NOOP_DRAG}
    onDragMove={NOOP_DRAG_MOVE}
    onDragEnd={NOOP}
    onTextDblClick={NOOP_DRAG}
  />
)}
```

- [ ] **Step 10: Verify build**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 11: Manual smoke test**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm dev`

Test each of these interactions:
1. Draw a rectangle — should appear normally
2. Draw a second rectangle — should appear normally
3. Drag a shape — should move smoothly with snap guides
4. Select multiple shapes with drag-select — should highlight correctly
5. Pan with space+drag — should be smooth
6. Zoom with scroll wheel — should be smooth
7. Group two shapes (Cmd+G) and drag — should move together
8. Undo/redo — should work correctly
9. Draw an arrow between two shapes — should connect and snap to anchors
10. Drag a shape with a bound arrow — arrow should follow
11. Double-click a shape to edit text — should open text editor
12. Right-click for context menu — should appear correctly

Expected: All interactions work correctly with noticeably smoother performance.

- [ ] **Step 12: Commit**

```bash
git add packages/canvas/src/components/FlowbaseCanvas.tsx
git commit -m "perf(canvas): stabilize callbacks, memoize sort, batch drag, deduplicate select"
```

---

### Task 5: Split Zustand Selectors in SelectionLayer

Independent of Tasks 3-4, can be done in parallel.

**Files:**
- Modify: `packages/canvas/src/components/SelectionLayer.tsx:1-33`

- [ ] **Step 1: Add `useMemo` to imports**

In `packages/canvas/src/components/SelectionLayer.tsx`, update the import on line 1:

```ts
import { useRef, useEffect, useCallback, useMemo } from 'react';
```

- [ ] **Step 2: Split store subscription and memoize lineArrowIds**

Replace lines 12-13:

```ts
const { selectedIds, elements, updateElement } = useCanvasStore();
```

With:

```ts
const selectedIds = useCanvasStore((s) => s.selectedIds);
const elements = useCanvasStore((s) => s.elements);
const updateElement = useCanvasStore((s) => s.updateElement);

const lineArrowIds = useMemo(
  () => new Set(elements.filter((el) => el.type === 'line' || el.type === 'arrow').map((el) => el.id)),
  [elements]
);
```

- [ ] **Step 3: Update useEffect to use memoized lineArrowIds**

Replace the useEffect (lines 14-33):

```ts
useEffect(() => {
  const transformer = transformerRef.current;
  const stage = stageRef.current;
  if (!transformer || !stage) return;

  const layer = transformer.getLayer();
  if (!layer) return;

  const selectedNodes = Array.from(selectedIds)
    .filter((id) => !lineArrowIds.has(id))
    .map((id) => stage.findOne(`#${id}`))
    .filter((node): node is Konva.Node => node !== null && node !== undefined);

  transformer.nodes(selectedNodes);
  layer.batchDraw();
}, [selectedIds, lineArrowIds, stageRef]);
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add packages/canvas/src/components/SelectionLayer.tsx
git commit -m "perf(canvas): split selectors and memoize lineArrowIds in SelectionLayer"
```

---

### Task 6: Split Zustand Selectors in CanvasEditor

Independent of canvas package tasks.

**Files:**
- Modify: `apps/web/src/components/canvas/CanvasEditor.tsx:58-86`

- [ ] **Step 1: Replace monolithic store destructure with individual selectors**

In `apps/web/src/components/canvas/CanvasEditor.tsx`, replace lines 58-86:

```ts
const {
  activeTool,
  setTool,
  viewport,
  zoomTo,
  undo,
  redo,
  canUndo,
  canRedo,
  copy,
  paste,
  deleteElements,
  selectedIds,
  elements,
  group,
  ungroup,
  bringForward,
  sendBackward,
  alignLeft,
  alignCenterH,
  alignRight,
  alignTop,
  alignCenterV,
  alignBottom,
  distributeH,
  distributeV,
  pushHistory,
  setElements,
} = useCanvasStore();
```

With:

```ts
const activeTool = useCanvasStore((s) => s.activeTool);
const setTool = useCanvasStore((s) => s.setTool);
const viewport = useCanvasStore((s) => s.viewport);
const zoomTo = useCanvasStore((s) => s.zoomTo);
const undo = useCanvasStore((s) => s.undo);
const redo = useCanvasStore((s) => s.redo);
const canUndo = useCanvasStore((s) => s.canUndo);
const canRedo = useCanvasStore((s) => s.canRedo);
const copy = useCanvasStore((s) => s.copy);
const paste = useCanvasStore((s) => s.paste);
const deleteElements = useCanvasStore((s) => s.deleteElements);
const selectedIds = useCanvasStore((s) => s.selectedIds);
const elements = useCanvasStore((s) => s.elements);
const group = useCanvasStore((s) => s.group);
const ungroup = useCanvasStore((s) => s.ungroup);
const bringForward = useCanvasStore((s) => s.bringForward);
const sendBackward = useCanvasStore((s) => s.sendBackward);
const alignLeft = useCanvasStore((s) => s.alignLeft);
const alignCenterH = useCanvasStore((s) => s.alignCenterH);
const alignRight = useCanvasStore((s) => s.alignRight);
const alignTop = useCanvasStore((s) => s.alignTop);
const alignCenterV = useCanvasStore((s) => s.alignCenterV);
const alignBottom = useCanvasStore((s) => s.alignBottom);
const distributeH = useCanvasStore((s) => s.distributeH);
const distributeV = useCanvasStore((s) => s.distributeV);
const pushHistory = useCanvasStore((s) => s.pushHistory);
const setElements = useCanvasStore((s) => s.setElements);
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/canvas/CanvasEditor.tsx
git commit -m "perf(web): split Zustand selectors in CanvasEditor"
```

---

### Task 7: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build check**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm build`
Expected: Clean build, no errors.

- [ ] **Step 2: Full manual regression test**

Run: `cd /Users/georgette/Desktop/Flowbase && pnpm dev`

Open the app in Chrome. Run through the complete interaction set:
1. Create a new project
2. Draw shapes: rectangle, ellipse, diamond, line, arrow, freehand, text
3. Select and drag shapes — should feel noticeably smoother
4. Multi-select with drag box
5. Group shapes and drag the group
6. Connect shapes with arrows, then drag connected shapes
7. Pan (space+drag) and zoom (scroll/pinch)
8. Undo/redo all actions
9. Edit text on shapes (double-click)
10. Use context menu AI actions (if API key configured)
11. Export project
12. Auto-save indicator should show "Saved"

Expected: All interactions work correctly. Dragging and general interactions should feel visibly smoother.

- [ ] **Step 3 (optional): Profile with React DevTools**

Open React DevTools Profiler. Record while dragging a shape.

Before this optimization: every shape re-renders on every frame.
After: only the dragged shape (and grouped/bound shapes) should re-render.
