'use client';

import type { ReactNode } from 'react';

interface FloatingPillProps {
  children: ReactNode;
  className?: string;
}

const FloatingPill = ({ children, className = '' }: FloatingPillProps) => {
  return (
    <div
      className={`rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  );
};

export default FloatingPill;
