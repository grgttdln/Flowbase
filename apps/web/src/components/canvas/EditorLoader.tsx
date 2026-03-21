'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCanvasStore } from '@flowbase/canvas';
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
      const p = await getProject(projectId);
      if (cancelled) return;
      if (!p || p.deletedAt !== null) {
        router.replace('/');
        return;
      }
      useCanvasStore.getState().setElements(p.scene.elements);
      setProject(p);
      setLoading(false);
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

  return <CanvasEditor projectId={projectId} projectName={project!.name} />;
};

export default EditorLoader;
