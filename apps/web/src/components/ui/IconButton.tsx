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
  const sizeClasses = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 16 : 18;
  const radiusClass = size === 'sm' ? 'rounded-md' : 'rounded-lg';

  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isActive}
        className={`flex items-center justify-center transition-colors duration-150 ${sizeClasses} ${radiusClass} ${
          disabled
            ? 'cursor-default text-gray-300'
            : isActive
              ? 'bg-[#007AFF] text-white'
              : 'text-[#666666] hover:bg-black/[0.04]'
        }`}
      >
        <Icon size={iconSize} />
      </button>
    </Tooltip>
  );
};

export default IconButton;
