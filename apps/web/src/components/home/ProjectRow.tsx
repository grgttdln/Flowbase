'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

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
      className="group flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
      onClick={() => !renaming && onClick()}
    >
      {/* Thumbnail */}
      <div className="h-9 w-12 flex-shrink-0 overflow-hidden rounded-md bg-[#F5F5F5]">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#CCCCCC]">
            Empty
          </div>
        )}
      </div>

      {/* Name + time */}
      <div className="min-w-0 flex-1">
        {renaming ? (
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
            className="w-full rounded-md border border-[#007AFF] px-1.5 py-0.5 text-[13px] font-medium text-[#1a1a1a] outline-none"
          />
        ) : (
          <div className="truncate text-[13px] font-medium text-[#1a1a1a]">
            {project.name}
          </div>
        )}
        <div className="text-[11px] text-[#999999]">
          {formatRelativeTime(project.updatedAt)}
        </div>
      </div>

      {/* Action menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="rounded-md p-1.5 text-[#CCCCCC] opacity-0 transition-all hover:bg-[#F5F5F5] hover:text-[#666666] group-hover:opacity-100"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg bg-white py-1 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setRenaming(true);
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] text-[#1a1a1a] hover:bg-[#F5F5F5]"
            >
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full px-3 py-1.5 text-left text-[13px] text-[#FF3B30] hover:bg-[#F5F5F5]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectRow;
