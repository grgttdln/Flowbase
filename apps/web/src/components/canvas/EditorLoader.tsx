'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasStore, CollaborationProvider, recalcBoundArrow } from '@flowbase/canvas';
import type { Project } from '@flowbase/shared';
import { getProject } from '@/lib/db';
import CanvasEditor from './CanvasEditor';

interface EditorLoaderProps {
  projectId: string;
}

const EditorLoader = ({ projectId }: EditorLoaderProps) => {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProject(projectId);
        if (cancelled) return;
        if (!p || p.deletedAt !== null) {
          router.replace('/projects');
          return;
        }
        // Recalculate bound arrows so connections snap to actual anchor positions
        let elements = p.scene.elements;
        elements = elements.map((el) => {
          if ((el.type !== 'arrow' && el.type !== 'line') || (!el.startBinding && !el.endBinding)) return el;
          const updates = recalcBoundArrow(el, elements);
          return updates ? { ...el, ...updates } : el;
        });
        useCanvasStore.getState().setElements(elements);
        setProject(p);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load project:', err);
        if (!cancelled) router.replace('/projects');
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  return (
    <CollaborationProvider>
      <CanvasEditor projectId={projectId} projectName={project!.name} savedAIPopovers={project!.aiPopovers} />
    </CollaborationProvider>
  );
};

export default EditorLoader;
