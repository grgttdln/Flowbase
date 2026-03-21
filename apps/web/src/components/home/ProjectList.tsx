'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/useProjectStore';
import { importFlowbaseFile } from '@/lib/import';
import ProjectRow from './ProjectRow';
import DeletedSection from './DeletedSection';
import EmptyState from './EmptyState';

const ProjectList = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const {
    projects,
    deleted,
    loading,
    loadProjects,
    createProject,
    renameProject,
    softDelete,
    restore,
    permanentlyDelete,
  } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    const id = await createProject();
    router.push(`/editor/${id}`);
  };

  const handleOpen = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleImport = useCallback(async (file: File) => {
    setImportError(null);
    const result = await importFlowbaseFile(file);
    if (result.success && result.projectId) {
      if (result.warning) {
        console.warn(result.warning);
      }
      router.push(`/editor/${result.projectId}`);
    } else {
      setImportError(result.errors?.[0] ?? 'Import failed');
    }
  }, [router]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleImport(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleImport]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.flowbase')) {
      await handleImport(file);
    } else if (file) {
      setImportError('Only .flowbase files can be imported');
    }
  }, [handleImport]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <p className="text-sm text-[#999999]">Loading projects...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#F5F5F5] ${dragging ? 'ring-4 ring-inset ring-[#007AFF]/30' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Your Projects</h1>
            <p className="mt-1 text-sm text-[#999999]">Flowbase</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-medium text-[#666666] transition-colors hover:bg-[#F5F5F5]"
            >
              Import
            </button>
            <button
              onClick={handleCreate}
              className="rounded-xl bg-[#007AFF] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0066D6]"
            >
              + New Project
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".flowbase"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Import error */}
        {importError && (
          <div className="mb-4 rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">
            {importError}
          </div>
        )}

        {/* Project list or empty state */}
        {projects.length === 0 && deleted.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onClick={() => handleOpen(project.id)}
                  onRename={(name) => renameProject(project.id, name)}
                  onDelete={() => softDelete(project.id)}
                />
              ))}
            </div>
            <DeletedSection
              projects={deleted}
              onRestore={restore}
              onPermanentlyDelete={permanentlyDelete}
            />
          </>
        )}

        {/* Drag hint */}
        {dragging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#007AFF]/10 pointer-events-none">
            <div className="rounded-2xl bg-white px-8 py-6 shadow-lg">
              <p className="text-lg font-medium text-[#007AFF]">Drop .flowbase file to import</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
