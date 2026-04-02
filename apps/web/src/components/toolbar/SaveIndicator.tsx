'use client';

import FloatingPill from '../ui/FloatingPill';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveIndicatorProps {
  status: SaveStatus;
  onSave?: () => void;
}

const STATUS_CONFIG: Record<SaveStatus, { text: string; color: string }> = {
  saved: { text: 'Saved', color: 'text-[#16a34a]' },
  saving: { text: 'Saving...', color: 'text-[#a1a1aa]' },
  error: { text: 'Save failed', color: 'text-[#dc2626]' },
};

const SaveIndicator = ({ status, onSave }: SaveIndicatorProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <FloatingPill
      className={`px-3 py-1.5 ${onSave ? 'cursor-pointer transition-shadow hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.1)]' : ''}`}
      onClick={onSave}
    >
      <span className={`text-[11px] font-medium ${config.color}`}>{config.text}</span>
    </FloatingPill>
  );
};

export default SaveIndicator;
