'use client';

import FloatingPill from '../ui/FloatingPill';

const STAMPS = [
  ['👍', '👎', '🙏', '👏', '😍'],
  ['😁', '🤣', '🤪', '🥳', '😮'],
  ['😎', '🤩', '😑', '✌️', '👇'],
  ['👆', '👈', '👉', '🔥', '💯'],
  ['🌶️', '🎉', '❤️', '❓', '⭐'],
];

interface StampPanelProps {
  selectedStamp: string;
  onStampSelect: (stamp: string) => void;
}

const StampPanel = ({ selectedStamp, onStampSelect }: StampPanelProps) => {
  return (
    <FloatingPill className="mx-auto w-fit p-3">
      <p className="mb-2 text-xs font-semibold text-[#333]">Stamps</p>
      <div className="flex flex-col gap-1">
        {STAMPS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1">
            {row.map((stamp) => (
              <button
                key={stamp}
                onClick={() => onStampSelect(stamp)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all duration-100 ${
                  selectedStamp === stamp
                    ? 'bg-[#7c3aed]/[0.12] ring-1 ring-[#7c3aed]/30'
                    : 'hover:bg-black/[0.04] active:scale-90'
                }`}
              >
                {stamp}
              </button>
            ))}
          </div>
        ))}
      </div>
    </FloatingPill>
  );
};

export default StampPanel;
