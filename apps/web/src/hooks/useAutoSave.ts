import { useEffect, useRef, useCallback, useState } from 'react';
import type Konva from 'konva';
import { useCanvasStore } from '@flowbase/canvas';
import { AUTO_SAVE_DEBOUNCE_MS } from '@flowbase/shared';
import { getProject, saveProject } from '@/lib/db';

export type SaveStatus = 'saved' | 'saving' | 'error';

export function useAutoSave(projectId: string, stageRef: React.RefObject<Konva.Stage | null>) {
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

      await saveProject({
        ...project,
        scene: { version: 1, elements },
        thumbnail,
        updatedAt: Date.now(),
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [projectId, stageRef]);

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
  }, [scheduleSave, doSave]);

  return { status, flushSave };
}
