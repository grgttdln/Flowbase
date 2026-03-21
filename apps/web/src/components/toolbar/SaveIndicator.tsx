'use client';

import FloatingPill from '../ui/FloatingPill';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveIndicatorProps {
  status: SaveStatus;
  onSave?: () => void;
}

const STATUS_CONFIG: Record<SaveStatus, { text: string; color: string }> = {
  saved: { text: 'Saved', color: 'text-[#34C759]' },
  saving: { text: 'Saving...', color: 'text-[#999999]' },
  error: { text: 'Save failed', color: 'text-[#FF3B30]' },
};

const SaveIndicator = ({ status, onSave }: SaveIndicatorProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <FloatingPill
      className={`px-3 py-1.5 ${onSave ? 'cursor-pointer transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)]' : ''}`}
      onClick={onSave}
    >
      <span className={`text-[11px] ${config.color}`}>{config.text}</span>
    </FloatingPill>
  );
};

export default SaveIndicator;
