import type { ElementType } from '../types/element';

const ELEMENT_TYPES: ElementType[] = [
  'rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'freehand', 'text',
];

const REQUIRED_ELEMENT_FIELDS = ['id', 'type', 'x', 'y', 'width', 'height'] as const;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  versionWarning?: string;
}

const CURRENT_VERSION = 1;

export function validateScene(data: unknown): ValidationResult {
  const errors: string[] = [];
  let versionWarning: string | undefined;

  if (data === null || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number') {
    errors.push('Missing or invalid "version" field');
  } else if (obj.version > CURRENT_VERSION) {
    versionWarning = `File version ${obj.version} is newer than supported version ${CURRENT_VERSION}. Some features may not load correctly.`;
  }

  if (!Array.isArray(obj.elements)) {
    errors.push('Missing or invalid "elements" array');
    return { valid: false, errors, versionWarning };
  }

  for (let i = 0; i < obj.elements.length; i++) {
    const el = obj.elements[i];
    if (el === null || typeof el !== 'object') {
      errors.push(`elements[${i}]: must be an object`);
      continue;
    }

    for (const field of REQUIRED_ELEMENT_FIELDS) {
      if (!(field in el)) {
        errors.push(`elements[${i}]: missing required field "${field}"`);
      }
    }

    if (typeof el.type === 'string' && !ELEMENT_TYPES.includes(el.type as ElementType)) {
      errors.push(`elements[${i}]: unknown type "${el.type}"`);
    }

    for (const numField of ['x', 'y', 'width', 'height'] as const) {
      if (numField in el && typeof el[numField] !== 'number') {
        errors.push(`elements[${i}]: "${numField}" must be a number`);
      }
    }
  }

  return { valid: errors.length === 0, errors, versionWarning };
}
