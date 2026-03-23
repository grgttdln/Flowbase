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

function extractJSON(text: string): string {
  // Try the raw text first
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;

  // Try to extract from markdown code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find a JSON object in the text
  const jsonMatch = trimmed.match(/\{[\s\S]*"elements"[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return trimmed;
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

  return { elements, warnings };
}

export interface LayoutPosition {
  id: string;
  x: number;
  y: number;
}

export interface LayoutParseResult {
  positions: LayoutPosition[];
  warnings: string[];
}

function extractLayoutJSON(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const jsonMatch = trimmed.match(/\{[\s\S]*"layout"[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return trimmed;
}

export function parseLayoutResponse(text: string, existingIds: string[]): LayoutParseResult {
  const warnings: string[] = [];
  const idSet = new Set(existingIds);

  const jsonStr = extractLayoutJSON(text);
  let parsed: { layout?: unknown[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Could not parse AI layout response as JSON. Try again.');
  }

  if (!parsed.layout || !Array.isArray(parsed.layout)) {
    throw new Error('AI response missing "layout" array. Try again.');
  }

  const positions: LayoutPosition[] = [];

  for (let i = 0; i < parsed.layout.length; i++) {
    const raw = parsed.layout[i] as Record<string, unknown>;

    if (typeof raw.id !== 'string') {
      warnings.push(`Layout entry ${i}: missing or invalid id, skipping`);
      continue;
    }

    if (!idSet.has(raw.id)) {
      warnings.push(`Layout entry ${i}: id "${raw.id}" not found on canvas, skipping`);
      continue;
    }

    if (typeof raw.x !== 'number' || typeof raw.y !== 'number') {
      warnings.push(`Layout entry ${i}: missing x or y coordinate, skipping`);
      continue;
    }

    positions.push({
      id: raw.id,
      x: clamp(raw.x, -5000, 10000),
      y: clamp(raw.y, -5000, 10000),
    });
  }

  return { positions, warnings };
}
