'use client';

import { useEffect, useRef } from 'react';
import { X, Copy, RotateCcw } from 'lucide-react';

interface AIResponsePopoverProps {
  x: number;
  y: number;
  text: string;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const AIResponsePopover = ({ x, y, text, isLoading, error, onClose, onRetry }: AIResponsePopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [text]);

  // Clamp to viewport
  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 16);
    const top = Math.min(y, window.innerHeight - rect.height - 16);
    el.style.left = `${Math.max(16, left)}px`;
    el.style.top = `${Math.max(16, top)}px`;
  }, [x, y, text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API may not be available
    }
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="AI Response"
      className="fixed z-50 w-[360px] rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
      style={{ left: x, top: y, animation: 'contextMenuIn 150ms ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-[#007AFF]">AI Response</span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[#999] transition-colors hover:bg-black/[0.04] hover:text-[#666]"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        aria-live="polite"
        className="max-h-[300px] overflow-y-auto px-4 py-3"
      >
        {error ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-red-500">{error}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#F5F5F5] px-3 py-1.5 text-[12px] font-medium text-[#333] transition-colors hover:bg-[#EBEBEB]"
            >
              <RotateCcw size={12} />
              Retry
            </button>
          </div>
        ) : text ? (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#333]">{text}</p>
        ) : isLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-[#F0F0F0]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#F0F0F0]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        ) : null}
      </div>

      {/* Footer — only show when there's text */}
      {text && !error && (
        <div className="border-t border-[#F0F0F0] px-4 py-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#666] transition-colors hover:bg-black/[0.04] hover:text-[#333]"
          >
            <Copy size={12} />
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

export default AIResponsePopover;
