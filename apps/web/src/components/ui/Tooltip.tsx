'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  shortcut?: string;
}

const Tooltip = ({ content, children, shortcut }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), 500);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1C1C1E] px-2.5 py-1.5 text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
          <span>{content}</span>
          {shortcut && <span className="ml-1.5 text-white/50">{shortcut}</span>}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
