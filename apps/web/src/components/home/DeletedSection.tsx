'use client';

import { useState } from 'react';
import { ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
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
    <div className="mt-16">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#A8A29E] transition-colors duration-300 hover:text-[#78716C]"
      >
        <ChevronRight
          size={14}
          className={`transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${expanded ? 'rotate-90' : ''}`}
        />
        Recently deleted
        <span className="ml-0.5 rounded-full bg-[#F5F5F4] px-2 py-0.5 text-[11px] font-medium text-[#A8A29E] ring-1 ring-black/[0.04]">
          {projects.length}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-[#FAFAF9]/60 p-1 ring-1 ring-black/[0.04]">
          <div className="overflow-hidden rounded-[calc(1.5rem-0.25rem)] bg-white/80 backdrop-blur-sm">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className={`group flex items-center gap-3 px-5 py-3.5 transition-colors duration-300 hover:bg-[#FAFAF9] ${
                  i < projects.length - 1 ? 'border-b border-[#F5F5F4]' : ''
                }`}
              >
                <div className="h-8 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-[#F5F5F4] ring-1 ring-black/[0.04]">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt="" className="h-full w-full object-cover opacity-40" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D6D3D1" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#A8A29E]">
                    {project.name}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    onClick={() => onRestore(project.id)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#57534E] ring-1 ring-[#E7E5E4] transition-all duration-300 hover:bg-[#F5F5F4] hover:text-[#1C1917]"
                    aria-label="Restore project"
                  >
                    <RotateCcw size={11} />
                    Restore
                  </button>
                  <button
                    onClick={() => onPermanentlyDelete(project.id)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#dc2626] transition-all duration-300 hover:bg-[#FEF2F2]"
                    aria-label="Delete project permanently"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedSection;
