import type { Element } from '@flowbase/shared';

const SNAP_THRESHOLD = 5;

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export interface SnapGuide {
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  elements: Element[],
  selfId: string,
  options: { snapToGrid: boolean; snapToElements: boolean; gridSize: number },
): SnapResult => {
  let snappedX = x;
  let snappedY = y;
  const guides: SnapGuide[] = [];

  // Snap to grid
  if (options.snapToGrid) {
    snappedX = snapToGrid(x, options.gridSize);
    snappedY = snapToGrid(y, options.gridSize);
  }

  // Snap to other elements
  if (options.snapToElements) {
    const others = elements.filter((el) => el.id !== selfId);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const rightEdge = x + width;
    const bottomEdge = y + height;

    let bestDx = SNAP_THRESHOLD + 1;
    let bestDy = SNAP_THRESHOLD + 1;

    for (const other of others) {
      const oCenterX = other.x + other.width / 2;
      const oCenterY = other.y + other.height / 2;
      const oRight = other.x + other.width;
      const oBottom = other.y + other.height;

      // Horizontal snaps (x-axis)
      const xSnaps = [
        { from: x, to: other.x },           // left-to-left
        { from: x, to: oRight },             // left-to-right
        { from: rightEdge, to: other.x },    // right-to-left
        { from: rightEdge, to: oRight },      // right-to-right
        { from: centerX, to: oCenterX },      // center-to-center
      ];

      for (const snap of xSnaps) {
        const d = Math.abs(snap.from - snap.to);
        if (d < SNAP_THRESHOLD && d < bestDx) {
          bestDx = d;
          snappedX = x + (snap.to - snap.from);
          guides.push({ orientation: 'vertical', position: snap.to });
        }
      }

      // Vertical snaps (y-axis)
      const ySnaps = [
        { from: y, to: other.y },            // top-to-top
        { from: y, to: oBottom },             // top-to-bottom
        { from: bottomEdge, to: other.y },    // bottom-to-top
        { from: bottomEdge, to: oBottom },     // bottom-to-bottom
        { from: centerY, to: oCenterY },       // center-to-center
      ];

      for (const snap of ySnaps) {
        const d = Math.abs(snap.from - snap.to);
        if (d < SNAP_THRESHOLD && d < bestDy) {
          bestDy = d;
          snappedY = y + (snap.to - snap.from);
          guides.push({ orientation: 'horizontal', position: snap.to });
        }
      }
    }
  }

  return { x: snappedX, y: snappedY, guides };
};
