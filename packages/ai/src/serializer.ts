import type { Element } from '@flowbase/shared';

const MAX_ELEMENTS = 50;

function describeElement(el: Element): string {
  const parts: string[] = [];

  // Type
  const typeName = el.type.charAt(0).toUpperCase() + el.type.slice(1);
  parts.push(typeName);

  // Position and size
  parts.push(`at (${Math.round(el.x)}, ${Math.round(el.y)})`);
  if (el.type !== 'freehand') {
    parts.push(`size ${Math.round(el.width)}x${Math.round(el.height)}`);
  }

  // Points for line/arrow/freehand
  if (el.points && el.points.length > 0) {
    parts.push(`${el.points.length / 2} points`);
  }

  // Colors (only if non-default)
  if (el.fill && el.fill !== 'transparent' && el.fill !== 'none') {
    parts.push(`fill: ${el.fill}`);
  }
  if (el.stroke) {
    parts.push(`stroke: ${el.stroke}`);
  }

  // Text content
  if (el.text) {
    parts.push(`text: "${el.text}"`);
  }

  // Bindings
  if (el.startBinding) {
    parts.push(`connected from: ${el.startBinding.elementId.slice(0, 6)} (${el.startBinding.anchor})`);
  }
  if (el.endBinding) {
    parts.push(`connected to: ${el.endBinding.elementId.slice(0, 6)} (${el.endBinding.anchor})`);
  }

  // Group
  if (el.groupId) {
    parts.push(`group: ${el.groupId.slice(0, 6)}`);
  }

  return parts.join(', ');
}

export function serializeElements(elements: Element[]): string {
  const truncated = elements.length > MAX_ELEMENTS;
  const subset = truncated ? elements.slice(0, MAX_ELEMENTS) : elements;

  const lines = subset.map((el, i) => `${i + 1}. ${describeElement(el)}`);

  let result = `Canvas contains ${elements.length} element${elements.length !== 1 ? 's' : ''}:\n`;
  result += lines.join('\n');

  if (truncated) {
    result += `\n\n(Showing first ${MAX_ELEMENTS} of ${elements.length} elements. Analysis is based on a partial view.)`;
  }

  return result;
}

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
