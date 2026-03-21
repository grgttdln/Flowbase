'use client';

import { useState, useRef, useCallback } from 'react';
import type { AIActionType, SerializedScene } from '@flowbase/shared';
import { DEFAULT_MODEL } from '@flowbase/ai';

const STORAGE_KEY_API_KEY = 'flowbase:ai:apiKey';
const STORAGE_KEY_MODEL = 'flowbase:ai:model';

export function getAISettings() {
  if (typeof window === 'undefined') return { apiKey: '', model: DEFAULT_MODEL };
  return {
    apiKey: localStorage.getItem(STORAGE_KEY_API_KEY) ?? '',
    model: localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL,
  };
}

export function setAISettings(settings: { apiKey?: string; model?: string }) {
  if (settings.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API_KEY, settings.apiKey);
  if (settings.model !== undefined) localStorage.setItem(STORAGE_KEY_MODEL, settings.model);
}

interface UseAIActionReturn {
  run: (action: AIActionType, scene: SerializedScene, selectedIds?: string[]) => void;
  text: string;
  isLoading: boolean;
  error: string | null;
  abort: () => void;
  reset: () => void;
  needsApiKey: boolean;
}

export function useAIAction(): UseAIActionReturn {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    setText('');
    setIsLoading(false);
    setError(null);
    setNeedsApiKey(false);
  }, [abort]);

  const run = useCallback(
    async (action: AIActionType, scene: SerializedScene, selectedIds?: string[]) => {
      const { apiKey, model } = getAISettings();
      if (!apiKey) {
        setNeedsApiKey(true);
        return;
      }

      // Abort previous request
      abort();
      setNeedsApiKey(false);
      setText('');
      setError(null);
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ action, scene, selectedIds, model }),
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
                setText((prev) => prev + parsed);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected') throw e;
            }
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [abort],
  );

  return { run, text, isLoading, error, abort, reset, needsApiKey };
}
