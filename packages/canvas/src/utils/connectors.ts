import type { Element, AnchorPosition, Binding } from '@flowbase/shared';

const SNAP_THRESHOLD = 20;

export interface AnchorPoint {
  x: number;
  y: number;
  anchor: AnchorPosition;
  elementId: string;
}

/** Get the four connection anchor points for a shape element */
export function getAnchorPoints(el: Element): AnchorPoint[] {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  return [
    { x: cx, y: el.y, anchor: 'top', elementId: el.id },
    { x: cx, y: el.y + el.height, anchor: 'bottom', elementId: el.id },
    { x: el.x, y: cy, anchor: 'left', elementId: el.id },
    { x: el.x + el.width, y: cy, anchor: 'right', elementId: el.id },
  ];
}

/** Get the absolute position of an anchor on an element */
export function getAnchorPosition(el: Element, anchor: AnchorPosition): { x: number; y: number } {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  switch (anchor) {
    case 'top': return { x: cx, y: el.y };
    case 'bottom': return { x: cx, y: el.y + el.height };
    case 'left': return { x: el.x, y: cy };
    case 'right': return { x: el.x + el.width, y: cy };
  }
}

/** Element types that can have connection points */
export const CONNECTABLE_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'text', 'stickynote']);

/** Check if an element type can have connection points */
function isConnectable(type: string): boolean {
  return CONNECTABLE_TYPES.has(type);
}

/** Find the nearest anchor point to a given position, within snap threshold */
export function findNearestAnchor(
  x: number,
  y: number,
  elements: Element[],
  excludeId?: string,
): AnchorPoint | null {
  let nearest: AnchorPoint | null = null;
  let minDist = SNAP_THRESHOLD;

  for (const el of elements) {
    if (el.id === excludeId || !isConnectable(el.type)) continue;
    for (const anchor of getAnchorPoints(el)) {
      const dist = Math.hypot(anchor.x - x, anchor.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = anchor;
      }
    }
  }

  return nearest;
}

/** Find the nearest anchor point within a custom radius */
export function findNearestAnchorWithRadius(
  x: number,
  y: number,
  elements: Element[],
  radius: number,
  excludeId?: string,
): AnchorPoint | null {
  let nearest: AnchorPoint | null = null;
  let minDist = radius;

  for (const el of elements) {
    if (el.id === excludeId || !isConnectable(el.type)) continue;
    for (const anchor of getAnchorPoints(el)) {
      const dist = Math.hypot(anchor.x - x, anchor.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = anchor;
      }
    }
  }

  return nearest;
}

/** Direction vector for an anchor — which way the connector should exit/enter */
function anchorDirection(anchor: AnchorPosition): { dx: number; dy: number } {
  switch (anchor) {
    case 'top': return { dx: 0, dy: -1 };
    case 'bottom': return { dx: 0, dy: 1 };
    case 'left': return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
  }
}

const ROUTE_MARGIN = 30;

/**
 * Generate orthogonal (right-angle) midpoints between two bound anchors.
 * Returns relative points array including start [0,0] and end.
 */
function calcAutoRoute(
  startX: number, startY: number, startAnchor: AnchorPosition,
  endX: number, endY: number, endAnchor: AnchorPosition,
): number[] {
  const sd = anchorDirection(startAnchor);
  const ed = anchorDirection(endAnchor);

  // Extension points — step out from each anchor in its direction
  const sx = startX + sd.dx * ROUTE_MARGIN;
  const sy = startY + sd.dy * ROUTE_MARGIN;
  const ex = endX + ed.dx * ROUTE_MARGIN;
  const ey = endY + ed.dy * ROUTE_MARGIN;

  const dx = endX - startX;
  const dy = endY - startY;

  // All points will be relative to startX, startY
  const rel = (x: number, y: number) => [x - startX, y - startY];

  const startIsH = sd.dx !== 0; // start exits horizontally
  const endIsH = ed.dx !== 0;   // end enters horizontally

  // Case 1: Both horizontal (e.g., right→left, right→right)
  if (startIsH && endIsH) {
    // If extensions can meet at a shared X midpoint
    const midX = (sx + ex) / 2;
    return [
      0, 0,
      ...rel(sx, startY),
      ...rel(midX, startY),
      ...rel(midX, endY),
      ...rel(ex, endY),
      ...rel(endX, endY),
    ];
  }

  // Case 2: Both vertical (e.g., bottom→top, bottom→bottom)
  if (!startIsH && !endIsH) {
    const midY = (sy + ey) / 2;
    return [
      0, 0,
      ...rel(startX, sy),
      ...rel(startX, midY),
      ...rel(endX, midY),
      ...rel(endX, ey),
      ...rel(endX, endY),
    ];
  }

  // Case 3: Perpendicular (one horizontal, one vertical)
  // The corner point is at the intersection of the two directions
  if (startIsH && !endIsH) {
    // Start goes horizontal, end goes vertical — corner at (endX, startY) area
    // Check if the direct corner works (extension goes toward the target)
    const cornerOk = (sd.dx > 0 ? endX >= startX : endX <= startX) &&
                     (ed.dy > 0 ? startY <= endY : startY >= endY);
    if (cornerOk) {
      return [
        0, 0,
        ...rel(endX, startY),
        ...rel(endX, endY),
      ];
    }
    // Fallback: use extension points with intermediate segment
    return [
      0, 0,
      ...rel(sx, startY),
      ...rel(sx, ey),
      ...rel(endX, ey),
      ...rel(endX, endY),
    ];
  }

  // startIsV && endIsH
  {
    const cornerOk = (ed.dx > 0 ? startX <= endX : startX >= endX) &&
                     (sd.dy > 0 ? endY >= startY : endY <= startY);
    if (cornerOk) {
      return [
        0, 0,
        ...rel(startX, endY),
        ...rel(endX, endY),
      ];
    }
    return [
      0, 0,
      ...rel(startX, sy),
      ...rel(ex, sy),
      ...rel(ex, endY),
      ...rel(endX, endY),
    ];
  }
}

/** Recalculate arrow points based on its bindings */
export function recalcBoundArrow(
  arrow: Element,
  elements: Element[],
): Partial<Element> | null {
  const { startBinding, endBinding } = arrow;
  if (!startBinding && !endBinding) return null;

  const points = arrow.points ? [...arrow.points] : [0, 0, 0, 0];
  if (points.length < 4) return null;

  // Resolve new endpoint positions
  let newStartX = arrow.x + points[0];
  let newStartY = arrow.y + points[1];
  let newEndX = arrow.x + points[points.length - 2];
  let newEndY = arrow.y + points[points.length - 1];

  let startAnchor: AnchorPosition | null = null;
  let endAnchor: AnchorPosition | null = null;

  if (startBinding) {
    const target = elements.find((el) => el.id === startBinding.elementId);
    if (target) {
      const pos = getAnchorPosition(target, startBinding.anchor);
      newStartX = pos.x;
      newStartY = pos.y;
      startAnchor = startBinding.anchor;
    }
  }

  if (endBinding) {
    const target = elements.find((el) => el.id === endBinding.elementId);
    if (target) {
      const pos = getAnchorPosition(target, endBinding.anchor);
      newEndX = pos.x;
      newEndY = pos.y;
      endAnchor = endBinding.anchor;
    }
  }

  // Auto-route: when both endpoints are bound and autoRoute is not disabled
  if (startBinding && endBinding && startAnchor && endAnchor && arrow.autoRoute !== false) {
    const newPoints = calcAutoRoute(
      newStartX, newStartY, startAnchor,
      newEndX, newEndY, endAnchor,
    );
    return {
      x: newStartX,
      y: newStartY,
      points: newPoints,
      width: Math.abs(newEndX - newStartX),
      height: Math.abs(newEndY - newStartY),
    };
  }

  // Manual mode: shift existing midpoints proportionally
  const oldStartX = arrow.x + points[0];
  const oldStartY = arrow.y + points[1];
  const oldEndX = arrow.x + points[points.length - 2];
  const oldEndY = arrow.y + points[points.length - 1];

  const newPts: number[] = [0, 0];
  if (points.length > 4) {
    const startDx = newStartX - oldStartX;
    const startDy = newStartY - oldStartY;
    const endDx = newEndX - oldEndX;
    const endDy = newEndY - oldEndY;
    const totalPairs = points.length / 2;
    for (let i = 1; i < totalPairs - 1; i++) {
      const t = i / (totalPairs - 1);
      const absX = arrow.x + points[i * 2] + startDx * (1 - t) + endDx * t;
      const absY = arrow.y + points[i * 2 + 1] + startDy * (1 - t) + endDy * t;
      newPts.push(absX - newStartX, absY - newStartY);
    }
  }
  newPts.push(newEndX - newStartX, newEndY - newStartY);

  return {
    x: newStartX,
    y: newStartY,
    points: newPts,
    width: Math.abs(newEndX - newStartX),
    height: Math.abs(newEndY - newStartY),
  };
}
