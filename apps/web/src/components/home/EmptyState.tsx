'use client';

import { Plus, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  onCreate: () => void;
}

const EmptyState = ({ onCreate }: EmptyStateProps) => {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#FAFAF9] py-28 ring-1 ring-black/[0.04]">
      <div className="relative flex flex-col items-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c3aed]/[0.08] ring-1 ring-[#7c3aed]/[0.08]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M12 18v-6" />
            <path d="M9 15h6" />
          </svg>
        </div>
        <span className="mb-4 inline-block rounded-full bg-[#7c3aed]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
          Get started
        </span>
        <h2 className="mb-2 text-[22px] font-bold tracking-tight text-[#1C1917]">No projects yet</h2>
        <p className="mb-8 max-w-[320px] text-center text-[15px] leading-relaxed text-[#78716C]">
          Start building your first flow. You can also drag and drop a .flowbase file to import.
        </p>
        <button
          onClick={onCreate}
          className="group inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-[#1C1917] px-7 py-3.5 text-[15px] font-medium text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#292524] active:scale-[0.97]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create your first project
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.12] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
            <ArrowUpRight size={12} strokeWidth={2} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
