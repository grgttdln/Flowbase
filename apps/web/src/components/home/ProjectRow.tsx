'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Project } from '@flowbase/shared';

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface ProjectRowProps {
  project: Project;
  onClick: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

const ProjectRow = ({ project, onClick, onRename, onDelete }: ProjectRowProps) => {
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  // Reset confirming state when mouse leaves the card
  const handleMouseLeave = () => {
    if (confirming) setConfirming(false);
  };

  const handleRenameSubmit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(trimmed);
    } else {
      setName(project.name);
    }
    setRenaming(false);
  };

  return (
    <div
      className="group relative cursor-pointer rounded-[1.5rem] bg-[#F5F5F4]/60 p-1.5 ring-1 ring-black/[0.04] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_24px_80px_rgba(124,58,237,0.06),0_8px_24px_rgba(0,0,0,0.04)]"
      onClick={() => !renaming && !confirming && onClick()}
      onMouseLeave={handleMouseLeave}
    >
      <div className="rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03]">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[calc(1.5rem-0.375rem)] bg-[#FAFAF9]">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle, #e7e5e4 0.8px, transparent 0.8px)', backgroundSize: '16px 16px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D6D3D1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* Hover action buttons — top-right of thumbnail */}
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
              }}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/90 text-[#57534E] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-[#1C1917] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95"
              aria-label="Rename project"
            >
              <Pencil size={13} strokeWidth={2} />
            </button>

            {confirming ? (
              <div className="flex items-center gap-1 rounded-xl bg-white/90 px-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] backdrop-blur-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirming(false);
                    onDelete();
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#dc2626] transition-all duration-200 hover:bg-[#FEF2F2] active:scale-95"
                  aria-label="Confirm delete"
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirming(false);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#78716C] transition-all duration-200 hover:bg-[#F5F5F4] active:scale-95"
                  aria-label="Cancel delete"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(true);
                }}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/90 text-[#57534E] shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] backdrop-blur-sm transition-all duration-200 hover:bg-[#FEF2F2] hover:text-[#dc2626] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95"
                aria-label="Delete project"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') {
                      setName(project.name);
                      setRenaming(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="-ml-1.5 min-w-0 flex-1 rounded-lg border border-[#7c3aed]/40 bg-[#f5f3ff]/50 px-2 py-1 text-[13px] font-medium text-[#1C1917] outline-none ring-2 ring-[#7c3aed]/10 transition-all duration-200 focus:border-[#7c3aed] focus:ring-[#7c3aed]/20"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameSubmit();
                  }}
                  className="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-[#7c3aed] transition-colors duration-200 hover:bg-[#f5f3ff]"
                  aria-label="Save name"
                >
                  <Check size={13} strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setName(project.name);
                    setRenaming(false);
                  }}
                  className="flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-[#A8A29E] transition-colors duration-200 hover:bg-[#F5F5F4] hover:text-[#57534E]"
                  aria-label="Cancel rename"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <p className="truncate text-[13px] font-semibold text-[#1C1917]">
                {project.name}
              </p>
            )}
            <p className="mt-0.5 text-[11px] font-medium text-[#A8A29E]">
              {formatRelativeTime(project.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRow;
