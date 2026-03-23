'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Copy, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIActionType } from '@flowbase/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

const ACTION_LABELS: Record<AIActionType, string> = {
  explain: 'AI: Explain',
  suggest: 'AI: Suggest',
  summarize: 'AI: Summarize',
  generate: 'AI: Generate',
  layout: 'AI: Layout',
};

export interface AIResponsePopoverProps {
  id: string;
  x: number;
  y: number;
  action: AIActionType;
  text: string;
  isLoading: boolean;
  error: string | null;
  collapsed: boolean;
  isActive: boolean;
  onClose: (id: string) => void;
  onRetry: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onToggleCollapse: (id: string) => void;
  onActivate: (id: string) => void;
}

const AIResponsePopover = ({
  id,
  x,
  y,
  action,
  text,
  isLoading,
  error,
  collapsed,
  isActive,
  onClose,
  onRetry,
  onMove,
  onToggleCollapse,
  onActivate,
}: AIResponsePopoverProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (contentRef.current && !collapsed) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [text, collapsed]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Don't drag from buttons
      if ((e.target as HTMLElement).closest('button')) return;
      onActivate(id);
      dragOffset.current = { x: e.clientX - x, y: e.clientY - y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
    },
    [id, x, y, onActivate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newX = Math.max(16, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 376));
      const newY = Math.max(16, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100));
      onMove(id, newX, newY);
    },
    [dragging, id, onMove],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setDragging(false);
    },
    [dragging],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API may not be available
    }
  };

  const preview = text ? text.slice(0, 60) + (text.length > 60 ? '...' : '') : '';

  return (
    <div
      role="dialog"
      aria-label={ACTION_LABELS[action]}
      className="fixed w-[360px] rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
      style={{
        left: x,
        top: y,
        zIndex: isActive ? 51 : 50,
        animation: 'contextMenuIn 150ms ease-out',
      }}
      onPointerDown={() => onActivate(id)}
    >
      {/* Header — drag handle */}
      <div
        className={`flex items-center gap-2 border-b border-[#F0F0F0] px-4 py-2.5 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="flex-1 truncate text-[13px] font-semibold text-[#007AFF]">
          {ACTION_LABELS[action]}
          {collapsed && preview && (
            <span className="ml-1.5 font-normal text-[#999]">— {preview}</span>
          )}
        </span>
        <button
          onClick={() => onToggleCollapse(id)}
          className="rounded-md p-1 text-[#999] transition-colors hover:bg-black/[0.04] hover:text-[#666]"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button
          onClick={() => onClose(id)}
          className="rounded-md p-1 text-[#999] transition-colors hover:bg-black/[0.04] hover:text-[#666]"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
        <>
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
                  onClick={() => onRetry(id)}
                  className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#F5F5F5] px-3 py-1.5 text-[12px] font-medium text-[#333] transition-colors hover:bg-[#EBEBEB]"
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              </div>
            ) : text ? (
              <div className="ai-markdown max-w-none text-[13px] leading-relaxed text-[#333]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    a: ({ ...props }) => (
                      <a target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
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
        </>
      )}
    </div>
  );
};

export default AIResponsePopover;
