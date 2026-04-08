'use client';

import type { LucideIcon } from 'lucide-react';
import Tooltip from './Tooltip';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

const IconButton = ({
  icon: Icon,
  label,
  shortcut,
  isActive = false,
  disabled = false,
  onClick,
  size = 'md',
}: IconButtonProps) => {
  const sizeClasses = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 15 : 17;
  const radiusClass = size === 'sm' ? 'rounded-[8px]' : 'rounded-[10px]';

  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isActive}
        className={`flex items-center justify-center transition-all duration-150 ${sizeClasses} ${radiusClass} ${
          disabled
            ? 'cursor-default text-[#6d28d9]/20'
            : isActive
              ? 'bg-[#7c3aed]/[0.12] text-[#7c3aed]'
              : 'text-[#a78bfa] hover:bg-[#7c3aed]/[0.06] hover:text-[#8b5cf6] active:scale-[0.92] active:bg-[#7c3aed]/[0.08]'
        }`}
      >
        <Icon size={iconSize} strokeWidth={isActive ? 2.4 : 2} />
      </button>
    </Tooltip>
  );
};

export default IconButton;
