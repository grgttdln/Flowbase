'use client';

interface EmptyStateProps {
  onCreate: () => void;
}

const EmptyState = ({ onCreate }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-4 text-5xl text-[#E5E5E5]">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[#1a1a1a]">No projects yet</h2>
      <p className="mb-6 text-sm text-[#999999]">Create your first project to get started</p>
      <button
        onClick={onCreate}
        className="rounded-xl bg-[#007AFF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0066D6]"
      >
        Create your first project
      </button>
    </div>
  );
};

export default EmptyState;
