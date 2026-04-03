import { useEffect, useRef, useCallback, useState } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@flowbase/canvas';
import type { SavedAIPopover } from '@flowbase/shared';
import { AUTO_SAVE_DEBOUNCE_MS } from '@flowbase/shared';
import { getProject, saveProject } from '@/lib/db';

export type SaveStatus = 'saved' | 'saving' | 'error';

export function useAutoSave(
  projectId: string,
  stageRef: React.RefObject<Konva.Stage | null>,
  enabled = true,
  aiPopoversRef?: React.RefObject<SavedAIPopover[]>,
) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef(false);

  const doSave = useCallback(async () => {
    pendingSave.current = false;
    setStatus('saving');
    try {
      const project = await getProject(projectId);
      if (!project || project.deletedAt !== null) return;

      const elements = useCanvasStore.getState().elements;
      let thumbnail = project.thumbnail;
      if (stageRef.current) {
        try {
          thumbnail = stageRef.current.toDataURL({ pixelRatio: 0.5 });
        } catch {
          // thumbnail generation can fail if canvas is empty
        }
      }

      const aiPopovers = aiPopoversRef?.current;

      await saveProject({
        ...project,
        scene: { version: 1, elements },
        thumbnail,
        updatedAt: Date.now(),
        ...(aiPopovers && aiPopovers.length > 0 ? { aiPopovers } : { aiPopovers: undefined }),
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [projectId, stageRef, aiPopoversRef]);

  const scheduleSave = useCallback(() => {
    pendingSave.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(doSave, AUTO_SAVE_DEBOUNCE_MS);
  }, [doSave]);

  const flushSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingSave.current) {
      doSave();
    }
  }, [doSave]);

  // Subscribe to element changes
  useEffect(() => {
    if (!enabled) return;
    let prevElements = useCanvasStore.getState().elements;
    const unsub = useCanvasStore.subscribe((state) => {
      if (state.elements !== prevElements) {
        prevElements = state.elements;
        scheduleSave();
      }
    });
    return () => {
      unsub();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingSave.current) {
        doSave();
      }
    };
  }, [scheduleSave, doSave, enabled]);

  return { status, flushSave, scheduleSave };
}
