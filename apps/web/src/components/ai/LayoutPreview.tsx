'use client';

import { useEffect } from 'react';

interface LayoutPreviewProps {
  onApply: () => void;
  onCancel: () => void;
}

const LayoutPreview = ({ onApply, onCancel }: LayoutPreviewProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApply, onCancel]);

  return (
    <div
      className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
      style={{ animation: 'contextMenuIn 150ms ease-out' }}
    >
      <span className="text-[13px] font-medium text-[#666666]">
        Layout preview
      </span>
      <button
        onClick={onCancel}
        className="rounded-lg px-4 py-1.5 text-[13px] font-medium text-[#666666] transition-colors hover:bg-black/[0.04]"
      >
        Cancel
      </button>
      <button
        onClick={onApply}
        className="rounded-lg bg-[#007AFF] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0066DD]"
      >
        Apply Layout
      </button>
    </div>
  );
};

export default LayoutPreview;
