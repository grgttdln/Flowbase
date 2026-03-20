'use client';

import FloatingPill from '../ui/FloatingPill';

type SaveStatus = 'saved' | 'saving' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
}

const STATUS_CONFIG: Record<SaveStatus, { text: string; color: string }> = {
  saved: { text: 'Saved', color: 'text-[#34C759]' },
  saving: { text: 'Saving...', color: 'text-[#999999]' },
  error: { text: 'Save failed', color: 'text-[#FF3B30]' },
};

const SaveIndicator = ({ status }: SaveIndicatorProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <FloatingPill className="px-3 py-1.5">
      <span className={`text-[11px] ${config.color}`}>{config.text}</span>
    </FloatingPill>
  );
};

export default SaveIndicator;
