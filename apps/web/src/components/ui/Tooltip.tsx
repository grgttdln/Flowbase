'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  shortcut?: string;
}

const Tooltip = ({ content, children, shortcut }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, 400);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
    setTimeout(() => setMounted(false), 150);
  }, []);

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {mounted && (
        <div
          className={`absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1a1a1c] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-150 ${
            visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
          }`}
        >
          <span>{content}</span>
          {shortcut && <span className="ml-1.5 text-white/40">{shortcut}</span>}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
