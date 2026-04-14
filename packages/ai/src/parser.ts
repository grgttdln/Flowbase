import type { Element, ElementType } from '@flowbase/shared';

const VALID_TYPES: ElementType[] = ['rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'freehand', 'text'];

interface RawElement {
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  points?: number[];
}

function findMatchingBrace(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

function sanitizeJSON(text: string): string {
  // Remove trailing commas before } or ]
  return text.replace(/,\s*([}\]])/g, '$1');
}

function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Try to extract from markdown code blocks first (most structured)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return sanitizeJSON(codeBlockMatch[1].trim());

  // Find the first balanced { ... } block in the text
  const braceMatch = findMatchingBrace(trimmed);
  if (braceMatch) return sanitizeJSON(braceMatch);

  // Last resort: if text looks like a bare array, wrap it
  if (trimmed.startsWith('[')) {
    return sanitizeJSON(`{"elements":${trimmed}}`);
  }

  return sanitizeJSON(trimmed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isValidColor(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color) ||
    /^(rgb|hsl)a?\(/.test(color) ||
    /^[a-z]+$/i.test(color);
}

export interface ParseResult {
  elements: Omit<Element, 'id' | 'zIndex'>[];
  warnings: string[];
}

export function parseGeneratedElements(text: string): ParseResult {
  const warnings: string[] = [];

  const jsonStr = extractJSON(text);
  let parsed: { elements?: RawElement[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Could not parse AI response as JSON. Try again with a clearer description.');
  }

  if (!parsed.elements || !Array.isArray(parsed.elements)) {
    throw new Error('AI response missing "elements" array. Try again.');
  }

  if (parsed.elements.length === 0) {
    throw new Error('AI returned an empty diagram. Try a more detailed description.');
  }

  const elements: Omit<Element, 'id' | 'zIndex'>[] = [];

  for (let i = 0; i < parsed.elements.length; i++) {
    const raw = parsed.elements[i];

    // Validate type
    const type = (raw.type ?? 'rectangle') as ElementType;
    if (!VALID_TYPES.includes(type)) {
      warnings.push(`Element ${i}: invalid type "${raw.type}", using rectangle`);
    }

    const validType = VALID_TYPES.includes(type) ? type : 'rectangle';

    // Validate numbers with defaults
    const x = typeof raw.x === 'number' ? clamp(raw.x, -5000, 10000) : 100;
    const y = typeof raw.y === 'number' ? clamp(raw.y, -5000, 10000) : 100;
    const width = typeof raw.width === 'number' ? clamp(raw.width, 20, 2000) : 120;
    const height = typeof raw.height === 'number' ? clamp(raw.height, 10, 2000) : 60;

    // Validate colors
    const fill = (raw.fill && isValidColor(raw.fill)) ? raw.fill : 'transparent';
    const stroke = (raw.stroke && isValidColor(raw.stroke)) ? raw.stroke : '#1971C2';
    const strokeWidth = typeof raw.strokeWidth === 'number' ? clamp(raw.strokeWidth, 1, 10) : 2;

    const element: Omit<Element, 'id' | 'zIndex'> = {
      type: validType,
      x,
      y,
      width,
      height,
      rotation: 0,
      fill,
      stroke,
      strokeWidth,
      opacity: 1,
      locked: false,
    };

    // Optional fields
    if (raw.text && typeof raw.text === 'string') {
      element.text = raw.text.slice(0, 200);
    }

    if (raw.fontSize && typeof raw.fontSize === 'number') {
      element.fontSize = clamp(raw.fontSize, 8, 72);
    } else if (validType === 'text') {
      element.fontSize = 16;
    }

    if (raw.points && Array.isArray(raw.points) && raw.points.length >= 4 && raw.points.every((p) => typeof p === 'number')) {
      element.points = raw.points;
    } else if (validType === 'arrow' || validType === 'line') {
      // Default to a horizontal line matching the width
      element.points = [0, 0, width, 0];
    }

    elements.push(element);
  }

  // Remove overlapping shapes (keep the first one at each position)
  const deduped: typeof elements = [];
  for (const el of elements) {
    if (el.type === 'arrow' || el.type === 'text') {
      deduped.push(el);
      continue;
    }
    const overlaps = deduped.some(
      (existing) =>
        existing.type !== 'arrow' &&
        existing.type !== 'text' &&
        Math.abs(existing.x - el.x) < 40 &&
        Math.abs(existing.y - el.y) < 40,
    );
    if (overlaps) {
      warnings.push(`Removed overlapping ${el.type} "${el.text ?? ''}" at (${el.x},${el.y})`);
    } else {
      deduped.push(el);
    }
  }

  return { elements: deduped, warnings };
}
