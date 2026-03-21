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
      className={`rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default FloatingPill;
