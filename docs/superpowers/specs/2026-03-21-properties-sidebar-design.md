# Properties Sidebar Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Related:** Phase 4 (UI Shell), Canvas store

---

## Goal

Add a left-side properties sidebar that appears when a drawing tool is selected or when canvas elements are selected. The sidebar allows editing visual properties (stroke, fill, stroke width, opacity, font size) and z-order. It operates in two modes: setting defaults for new elements, and editing selected elements.

---

## Behavior

### When the sidebar appears

- **Tool selected** (rectangle, ellipse, diamond, line, arrow, freehand, text): Sidebar slides in showing default style values for that tool type. Changes update the defaults used when creating new elements.
- **Element(s) selected on canvas** (via select tool or clicking): Sidebar slides in showing the selected element's current properties. Changes apply immediately via `updateElement`.
- **Select tool with nothing selected**: Sidebar is hidden.

### Multiple selection

When multiple elements are selected, the sidebar shows properties of the first matching element in the `elements` array (i.e., lowest positional order, deterministic regardless of selection order). Changes apply to **all** selected elements.

### Locked elements

Sidebar sections are visible but disabled (greyed out, non-interactive) for locked elements.

---

## Sections by Element Type

| Section | Shapes (rect, ellipse, diamond) | Lines (line, arrow, freehand) | Text |
|---------|:---:|:---:|:---:|
| Stroke color | yes | yes | yes |
| Background (fill) | yes | no | no |
| Stroke width | yes | yes | no |
| Font size | no | no | yes |
| Opacity | yes | yes | yes |
| Layers (z-order) | yes | yes | yes |

---

## Component Architecture

### File structure

```
apps/web/src/components/properties/
  PropertiesSidebar.tsx    -- container, slide animation, section composition
  ColorPicker.tsx          -- ~10 preset swatches + native color picker for custom
  StrokeWidthPicker.tsx    -- 3 toggle buttons (thin=1, medium=2, thick=4)
  OpacitySlider.tsx        -- range slider 0-100 (UI) mapped to 0-1 (model)
  FontSizePicker.tsx       -- S(16)/M(20)/L(28)/XL(36) toggle buttons
  LayerControls.tsx        -- 4 icon buttons: send to back, send backward, bring forward, bring to front
```

### Hook

```
packages/canvas/src/store/useStyleDefaults.ts
  -- Zustand store with persist middleware (localStorage)
  -- Stores default stroke, fill, strokeWidth, opacity, fontSize per tool category
  -- Three categories: shapes, lines, text
  -- Lives in packages/canvas so useToolHandlers can import it directly
```

### Integration point

`CanvasEditor.tsx` adds `<PropertiesSidebar />` to the layout. The sidebar reads `activeTool` and `selectedIds` from `useCanvasStore`, and either reads/writes defaults via `useStyleDefaults` or reads/writes element props via `updateElement`.

**Cross-package note:** `useStyleDefaults` lives in `packages/canvas/` (not `apps/web/`) because `useToolHandlers` (also in `packages/canvas/`) needs to read defaults when creating new elements. The sidebar UI components in `apps/web/` import it from `@flowbase/canvas`.

---

## Color Picker

### Presets (~10 colors)

```
#1B1B1B (black)
#E03131 (red)
#2F9E44 (green)
#1971C2 (blue)
#F08C00 (orange)
#9C36B5 (purple)
#0CA678 (teal)
#E8590C (deep orange)
#868E96 (grey)
#F783AC (pink)
```

### Custom color

The last swatch position shows a checkered pattern (indicating "custom"). Clicking it opens a native `<input type="color">`. The selected custom color replaces the checkered swatch visually.

---

## Sidebar Visual Design

- **Width:** 220px
- **Position:** Fixed left side, below the logo pill (top: ~72px to avoid overlap). The sidebar uses `z-[5]`; the logo pill and zoom controls remain on top at `z-10` and overlay the sidebar naturally.
- **Background:** White with subtle shadow (`shadow-lg`)
- **Border radius:** `rounded-2xl` on the right side
- **Padding:** 16px internal
- **Animation:** CSS `transition-transform` with `translate-x` for slide in/out (200ms ease)
- **Section spacing:** 20px between sections
- **Section labels:** 13px, font-medium, text-[#333]
- **Swatch size:** 28px squares, 2px rounded, 6px gap between
- **Active swatch indicator:** 2px blue ring (`ring-2 ring-[#007AFF]`)

---

## Style Defaults Store

```ts
interface StyleDefaults {
  shapes: { stroke: string; fill: string; strokeWidth: number; opacity: number };
  lines: { stroke: string; strokeWidth: number; opacity: number };
  text: { stroke: string; fontSize: number; opacity: number };
}
```

Tool-to-category mapping:
- `rectangle`, `ellipse`, `diamond` -> `shapes`
- `line`, `arrow`, `freehand` -> `lines`
- `text` -> `text`

When a new element is created (in `useToolHandlers`), it reads defaults from this store instead of hardcoded values. Since both `useStyleDefaults` and `useToolHandlers` live in `packages/canvas/`, this is a direct import with no cross-package boundary.

---

## Layer Controls

Four buttons matching the reference images:
1. **Send to back** (arrow pointing all the way down)
2. **Send backward** (arrow pointing down one step)
3. **Bring forward** (arrow pointing up one step)
4. **Bring to front** (arrow pointing all the way up)

`bringForward` and `sendBackward` already exist in the canvas store. Need to verify if `bringToFront` and `sendToBack` exist; if not, add them.

---

## Canvas Store Changes

### Needed additions (if not present)

- `bringToFront()` -- sets selected element(s) to highest zIndex
- `sendToBack()` -- sets selected element(s) to lowest zIndex

### Undo/redo for property changes

Property changes from the sidebar call `pushHistory()` before applying `updateElement`. For continuous controls (opacity slider), debounce the history push — only push once when the user starts dragging, not on every intermediate value. This prevents dozens of undo steps from a single slider drag.

### Existing (no changes needed)

- `updateElement(id, updates)` -- used for all property changes
- `bringForward()` / `sendBackward()` -- already implemented

---

## Scope Exclusions (future phases)

These properties are visible in the reference images but NOT included in this implementation:
- Stroke style (solid/dashed/dotted)
- Sloppiness (hand-drawn feel)
- Edges (sharp/round corners)
- Arrow type (straight/curved/elbow)
- Arrowheads (none/arrow)
- Font family
- Text align

These will require new fields on the Element type and canvas rendering changes.

---

## Clarifications

- **Opacity:** The UI displays 0-100 but the Element model stores 0-1. The `OpacitySlider` component handles the conversion (`value * 100` for display, `value / 100` for storage).
- **Font size default:** S=16 matches the existing `DEFAULT_FONT_SIZE` (16). Existing text elements will correctly highlight the "S" button.
- **Fill for lines/text:** The `fill` field exists on all elements but defaults to `'transparent'` for lines and text. The Background section is intentionally hidden for these types — `fill` stays `'transparent'`.
- **Text stroke width:** Not exposed in the sidebar. Text elements use the default strokeWidth (2) and it is not user-configurable in this phase. This avoids confusion since stroke on text is subtle.
- **Tool switch transition:** When switching from select (with selection) to a drawing tool, `setTool` clears `selectedIds`, so the sidebar instantly switches from element properties to tool defaults. No special transition needed.
