'use client';

import { ArrowDownToLine, ArrowDown, ArrowUp, ArrowUpToLine } from 'lucide-react';

interface LayerControlsProps {
  onSendToBack: () => void;
  onSendBackward: () => void;
  onBringForward: () => void;
  onBringToFront: () => void;
  disabled?: boolean;
}

const BUTTONS = [
  { key: 'sendToBack', icon: ArrowDownToLine, label: 'Send to back' },
  { key: 'sendBackward', icon: ArrowDown, label: 'Send backward' },
  { key: 'bringForward', icon: ArrowUp, label: 'Bring forward' },
  { key: 'bringToFront', icon: ArrowUpToLine, label: 'Bring to front' },
] as const;

const LayerControls = ({
  onSendToBack,
  onSendBackward,
  onBringForward,
  onBringToFront,
  disabled,
}: LayerControlsProps) => {
  const handlers: Record<string, () => void> = {
    sendToBack: onSendToBack,
    sendBackward: onSendBackward,
    bringForward: onBringForward,
    bringToFront: onBringToFront,
  };

  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2 block text-[13px] font-medium text-[#333]">Layers</span>
      <div className="flex gap-1.5">
        {BUTTONS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={handlers[key]}
            className="flex h-9 w-12 items-center justify-center rounded-lg bg-[#F5F5F5] text-[#666] transition-colors hover:bg-[#EBEBEB] hover:text-[#333]"
            aria-label={label}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerControls;
