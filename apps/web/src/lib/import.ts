import { validateScene } from '@flowbase/shared';
import type { Project } from '@flowbase/shared';
import { generateId } from '@flowbase/shared';
import { DEFAULT_ELEMENT_PROPS } from '@flowbase/shared';
import type { Element } from '@flowbase/shared';
import { saveProject } from './db';

export interface ImportResult {
  success: boolean;
  projectId?: string;
  errors?: string[];
  warning?: string;
}

function sanitizeElement(raw: Record<string, unknown>): Element {
  return {
    id: typeof raw.id === 'string' ? raw.id : generateId(),
    type: raw.type as Element['type'],
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    width: Number(raw.width) || 0,
    height: Number(raw.height) || 0,
    rotation: typeof raw.rotation === 'number' ? raw.rotation : DEFAULT_ELEMENT_PROPS.rotation,
    fill: typeof raw.fill === 'string' ? raw.fill : DEFAULT_ELEMENT_PROPS.fill,
    stroke: typeof raw.stroke === 'string' ? raw.stroke : DEFAULT_ELEMENT_PROPS.stroke,
    strokeWidth: typeof raw.strokeWidth === 'number' ? raw.strokeWidth : DEFAULT_ELEMENT_PROPS.strokeWidth,
    opacity: typeof raw.opacity === 'number' ? raw.opacity : DEFAULT_ELEMENT_PROPS.opacity,
    zIndex: typeof raw.zIndex === 'number' ? raw.zIndex : 0,
    locked: typeof raw.locked === 'boolean' ? raw.locked : DEFAULT_ELEMENT_PROPS.locked,
    ...(Array.isArray(raw.points) ? { points: raw.points } : {}),
    ...(typeof raw.text === 'string' ? { text: raw.text } : {}),
    ...(typeof raw.fontSize === 'number' ? { fontSize: raw.fontSize } : {}),
    ...(typeof raw.groupId === 'string' ? { groupId: raw.groupId } : {}),
  };
}

export async function importFlowbaseFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Support both wrapped format { scene: { ... } } and direct scene format { version, elements }
    const sceneData = data.scene ?? data;
    const result = validateScene(sceneData);

    if (!result.valid) {
      return { success: false, errors: result.errors };
    }

    const elements = sceneData.elements.map((el: Record<string, unknown>) => sanitizeElement(el));

    const id = generateId();
    const now = Date.now();
    const project: Project = {
      id,
      name: data.name ?? file.name.replace(/\.flowbase$/, '') ?? 'Imported',
      scene: { version: sceneData.version ?? 1, elements },
      thumbnail: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await saveProject(project);

    return {
      success: true,
      projectId: id,
      warning: result.versionWarning,
    };
  } catch (e) {
    return {
      success: false,
      errors: [e instanceof SyntaxError ? 'Invalid JSON file' : 'Failed to import file'],
    };
  }
}
