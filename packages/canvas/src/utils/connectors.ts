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

/** Check if an element type can have connection points */
function isConnectable(type: string): boolean {
  return type === 'rectangle' || type === 'ellipse' || type === 'diamond' || type === 'text';
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

/** Recalculate arrow points based on its bindings */
export function recalcBoundArrow(
  arrow: Element,
  elements: Element[],
): Partial<Element> | null {
  const { startBinding, endBinding } = arrow;
  if (!startBinding && !endBinding) return null;

  const points = arrow.points ? [...arrow.points] : [0, 0, 0, 0];
  if (points.length < 4) return null;

  let startX = arrow.x + points[0];
  let startY = arrow.y + points[1];
  let endX = arrow.x + points[points.length - 2];
  let endY = arrow.y + points[points.length - 1];

  if (startBinding) {
    const target = elements.find((el) => el.id === startBinding.elementId);
    if (target) {
      const pos = getAnchorPosition(target, startBinding.anchor);
      startX = pos.x;
      startY = pos.y;
    }
  }

  if (endBinding) {
    const target = elements.find((el) => el.id === endBinding.elementId);
    if (target) {
      const pos = getAnchorPosition(target, endBinding.anchor);
      endX = pos.x;
      endY = pos.y;
    }
  }

  // Arrow x,y is the start point; points are relative to x,y
  return {
    x: startX,
    y: startY,
    points: [0, 0, endX - startX, endY - startY],
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}
