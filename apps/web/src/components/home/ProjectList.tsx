'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useProjectStore } from '@/stores/useProjectStore';
import { importFlowbaseFile } from '@/lib/import';
import { Upload, Plus, AlertCircle, ArrowUpRight } from 'lucide-react';
import ProjectRow from './ProjectRow';
import DeletedSection from './DeletedSection';
import EmptyState from './EmptyState';
import TemplateDialog from '../dialogs/TemplateDialog';

/* ─── Scroll Reveal ─── */
const ScrollReveal = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(e.target); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const ProjectList = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
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

  const handleCreate = () => {
    setTemplateOpen(true);
  };

  const handleTemplateSelect = async (name: string, elements: import('@flowbase/shared').Element[]) => {
    try {
      const id = await createProject(name, elements);
      setTemplateOpen(false);
      router.push(`/editor/${id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setImportError(err instanceof Error ? err.message : 'Failed to create project');
      setTemplateOpen(false);
    }
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F0EFED] border-t-[#7c3aed]" />
          <p className="text-[13px] text-[#A8A29E]">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${dragging ? 'bg-[#f5f3ff]' : 'bg-white'}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Glassmorphism Navbar */}
      <nav className="sticky left-0 right-0 top-0 z-30 flex justify-center px-4 pt-5 pb-3">
        <div className="flex w-full max-w-5xl items-center justify-between rounded-full bg-white/75 py-2 pl-4 pr-2 shadow-[0_2px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur-2xl sm:pl-5 sm:pr-3">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-[#7c3aed]">
            <Image src="/logo.png" alt="Flowbase" width={28} height={28} />
            Flowbase
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-[#57534E] ring-1 ring-[#E7E5E4] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#F5F5F4] hover:text-[#1C1917] active:scale-[0.97]"
            >
              <Upload size={14} strokeWidth={2} />
              Import
            </button>
            <button
              onClick={handleCreate}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1C1917] px-5 py-2 text-[13px] font-medium text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#292524] active:scale-[0.97]"
            >
              <Plus size={15} strokeWidth={2.5} />
              New project
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.12] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                <ArrowUpRight size={10} strokeWidth={2} />
              </span>
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
      </nav>

      <div className="relative mx-auto max-w-5xl px-6 py-12 sm:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-[#7c3aed]/[0.08] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
              Your workspace
            </span>
            <h1 className="mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-[#1C1917]">
              Your projects
            </h1>
            {projects.length > 0 && (
              <p className="mt-2 text-[15px] text-[#78716C]">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} — keep building
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Import error */}
        {importError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-3.5 text-[13px] text-[#dc2626] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <AlertCircle size={16} strokeWidth={2} className="flex-shrink-0" />
            {importError}
          </div>
        )}

        {/* Project grid or empty state */}
        {projects.length === 0 && deleted.length === 0 ? (
          <ScrollReveal delay={100}>
            <EmptyState onCreate={handleCreate} />
          </ScrollReveal>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <ScrollReveal key={project.id} delay={80 + i * 60}>
                  <ProjectRow
                    project={project}
                    onClick={() => handleOpen(project.id)}
                    onRename={(name) => renameProject(project.id, name)}
                    onDelete={() => softDelete(project.id)}
                  />
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={200}>
              <DeletedSection
                projects={deleted}
                onRestore={restore}
                onPermanentlyDelete={permanentlyDelete}
              />
            </ScrollReveal>
          </>
        )}

        {/* Drag overlay */}
        {dragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#7c3aed]/5 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 rounded-[2rem] border-2 border-dashed border-[#7c3aed]/20 bg-white/90 px-14 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]">
              <Upload size={32} strokeWidth={1.5} className="text-[#7c3aed]" />
              <p className="text-[15px] font-medium text-[#1C1917]">Drop .flowbase file to import</p>
            </div>
          </div>
        )}
      </div>

      <TemplateDialog
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};

export default ProjectList;
