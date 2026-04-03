import type { Element } from '@flowbase/shared';

const MAX_ELEMENTS = 50;

function describeElement(el: Element, labelMap?: Map<string, string>): string {
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

  // Bindings — use text labels when available for readability
  if (el.startBinding) {
    const label = labelMap?.get(el.startBinding.elementId) ?? el.startBinding.elementId.slice(0, 6);
    parts.push(`connected from: ${label}`);
  }
  if (el.endBinding) {
    const label = labelMap?.get(el.endBinding.elementId) ?? el.endBinding.elementId.slice(0, 6);
    parts.push(`connected to: ${label}`);
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

  // Build a lookup from element ID to label for readable connection descriptions
  const labelMap = new Map<string, string>();
  for (const el of subset) {
    if (el.text) {
      labelMap.set(el.id, `"${el.text}"`);
    } else {
      labelMap.set(el.id, `${el.type} (${el.id.slice(0, 6)})`);
    }
  }

  const lines = subset.map((el, i) => `${i + 1}. ${describeElement(el, labelMap)}`);

  let result = `Canvas contains ${elements.length} element${elements.length !== 1 ? 's' : ''}:\n`;
  result += lines.join('\n');

  if (truncated) {
    result += `\n\n(Showing first ${MAX_ELEMENTS} of ${elements.length} elements. Analysis is based on a partial view.)`;
  }

  return result;
}

