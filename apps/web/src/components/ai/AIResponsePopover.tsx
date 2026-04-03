'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Copy, RotateCcw, ChevronUp, Workflow, BookOpen, Sparkles, AlignLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AIActionType } from '@flowbase/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

const ACTION_LABELS: Record<AIActionType, string> = {
  explain: 'Explain',
  suggest: 'Suggest',
  summarize: 'Summarize',
  generate: 'Generate',
};

const ACTION_ICONS: Record<AIActionType, LucideIcon> = {
  explain: BookOpen,
  suggest: Sparkles,
  summarize: AlignLeft,
  generate: Workflow,
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

  return (
    <div
      role="dialog"
      aria-label={ACTION_LABELS[action]}
      className={`fixed rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] transition-[width] duration-200 ${collapsed ? 'w-auto' : 'w-[360px]'}`}
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
        className={`flex items-center gap-2 ${collapsed ? 'px-2 py-2' : 'border-b border-[#e4e4e7] px-4 py-2.5'} ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {collapsed ? (
          <>
            <button
              onClick={() => onToggleCollapse(id)}
              className="rounded-lg p-1.5 text-[#7c3aed] transition-colors hover:bg-[rgba(124,58,237,0.06)]"
              aria-label="Expand"
            >
              {(() => { const Icon = ACTION_ICONS[action]; return <Icon size={16} />; })()}
            </button>
            <button
              onClick={() => onClose(id)}
              className="rounded-md p-1 text-[#a1a1aa] transition-colors hover:bg-black/[0.04] hover:text-[#52525b]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 flex-1 truncate text-[13px] font-semibold text-[#7c3aed]">
              {(() => { const Icon = ACTION_ICONS[action]; return <Icon size={14} className="shrink-0" />; })()}
              {ACTION_LABELS[action]}
            </span>
            <button
              onClick={() => onToggleCollapse(id)}
              className="rounded-md p-1 text-[#a1a1aa] transition-colors hover:bg-black/[0.04] hover:text-[#52525b]"
              aria-label="Collapse"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => onClose(id)}
              className="rounded-md p-1 text-[#a1a1aa] transition-colors hover:bg-black/[0.04] hover:text-[#52525b]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </>
        )}
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
                  className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#fafafa] px-3 py-1.5 text-[12px] font-medium text-[#18181b] transition-colors hover:bg-[#e4e4e7]"
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              </div>
            ) : text ? (
              <div className="ai-markdown max-w-none text-[13px] leading-relaxed text-[#18181b]">
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
                <div className="h-3 w-3/4 animate-pulse rounded bg-[#e4e4e7]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#e4e4e7]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#e4e4e7]" />
              </div>
            ) : null}
          </div>

          {/* Footer — only show when there's text */}
          {text && !error && (
            <div className="border-t border-[#e4e4e7] px-4 py-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#52525b] transition-colors hover:bg-black/[0.04] hover:text-[#18181b]"
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
