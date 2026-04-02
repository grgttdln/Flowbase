'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { parseGeneratedElements } from '@flowbase/ai';
import { useCanvasStore } from '@flowbase/canvas';
import { generateId } from '@flowbase/shared';
import { getAISettings } from '@/hooks/useAIAction';

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onNeedsApiKey: () => void;
}

const GenerateDialog = ({ open, onClose, onNeedsApiKey }: GenerateDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { elements, pushHistory, setElements, select, viewport } = useCanvasStore();

  useEffect(() => {
    if (open) {
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      abortRef.current?.abort();
      setIsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    const { apiKey, model } = getAISettings();
    if (!apiKey) {
      onClose();
      onNeedsApiKey();
      return;
    }

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Stream the response and accumulate full text
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ action: 'generate', prompt: prompt.trim(), model }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'string') {
              fullText += parsed;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected') throw e;
          }
        }
      }

      // Parse the accumulated response into elements
      const result = parseGeneratedElements(fullText);

      // Calculate viewport center in canvas coords
      const centerX = (window.innerWidth / 2 - viewport.panX) / viewport.zoom;
      const centerY = (window.innerHeight / 2 - viewport.panY) / viewport.zoom;

      // Calculate bounding box of generated elements
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of result.elements) {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      }

      const groupW = maxX - minX;
      const groupH = maxY - minY;
      const offsetX = centerX - groupW / 2 - minX;
      const offsetY = centerY - groupH / 2 - minY;

      // Create full elements with IDs and zIndex, centered on viewport
      const maxZ = elements.length > 0 ? Math.max(...elements.map((e) => e.zIndex)) : -1;
      const newElements = result.elements.map((el, i) => ({
        ...el,
        id: generateId(),
        x: el.x + offsetX,
        y: el.y + offsetY,
        zIndex: maxZ + 1 + i,
      }));

      // Push to canvas as a single undoable action
      pushHistory();
      const newIds = newElements.map((el) => el.id);
      setElements([...elements, ...newElements]);
      select(newIds);

      setPrompt('');
      onClose();
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [prompt, isLoading, elements, pushHistory, setElements, select, viewport, onClose, onNeedsApiKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[480px] rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Generate diagram"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-[#7c3aed]" />
            <span className="text-[15px] font-semibold text-[#18181b]">Generate Diagram</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#a1a1aa] transition-colors hover:bg-black/[0.04] hover:text-[#52525b]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Describe the diagram you want to create...&#10;&#10;e.g. &quot;A flowchart showing user authentication with login, 2FA verification, and dashboard steps&quot;"
            className="h-[120px] w-full resize-none rounded-xl border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 text-[14px] text-[#18181b] placeholder-[#a1a1aa] outline-none transition-colors focus:border-[#7c3aed] focus:bg-white"
            disabled={isLoading}
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e4e4e7] px-5 py-3.5">
          <span className="text-[11px] text-[#a1a1aa]">
            {isLoading ? 'Generating...' : '⌘↵ to generate'}
          </span>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Wand2 size={14} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateDialog;
