'use client';

import { useState } from 'react';
import type { Project } from '@flowbase/shared';

interface DeletedSectionProps {
  projects: Project[];
  onRestore: (id: string) => void;
  onPermanentlyDelete: (id: string) => void;
}

const DeletedSection = ({ projects, onRestore, onPermanentlyDelete }: DeletedSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  if (projects.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[13px] text-[#999999] transition-colors hover:text-[#666666]"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
        Recently Deleted ({projects.length})
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 opacity-60"
            >
              <div className="h-9 w-12 flex-shrink-0 overflow-hidden rounded-md bg-[#F5F5F5]">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-[#CCCCCC]">
                    Empty
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-[#1a1a1a]">
                  {project.name}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onRestore(project.id)}
                  className="rounded-md px-2.5 py-1 text-[12px] text-[#007AFF] transition-colors hover:bg-[#F0F0F0]"
                >
                  Restore
                </button>
                <button
                  onClick={() => onPermanentlyDelete(project.id)}
                  className="rounded-md px-2.5 py-1 text-[12px] text-[#FF3B30] transition-colors hover:bg-[#F0F0F0]"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeletedSection;
