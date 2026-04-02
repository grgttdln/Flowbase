'use client';

import type { ReactNode } from 'react';

interface FloatingPillProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const FloatingPill = ({ children, className = '', onClick }: FloatingPillProps) => {
  return (
    <div
      className={`rounded-[14px] border border-black/[0.06] bg-white/90 shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default FloatingPill;
