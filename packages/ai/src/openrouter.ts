import type { ChatMessage } from '@flowbase/shared';

export const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

const FREE_FALLBACK_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-4-maverick:free',
];

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface StreamChatOptions {
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export class AIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AIError';
  }
}

async function* streamChatSingle(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncIterable<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://flowbase.app',
      'X-Title': 'Flowbase',
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 401) throw new AIError('Invalid API key. Check your settings.', 401);
    if (response.status === 429) throw new AIError('Rate limited. Try again in a moment.', 429);
    throw new AIError(text || `Model ${model} unavailable`, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AIError('No response body', 500);

  const decoder = new TextDecoder();
  let buffer = '';
  let yielded = false;

  try {
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
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            const msg = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message || 'AI request failed';
            throw new AIError(msg, parsed.error?.code || 500);
          }
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yielded = true;
            yield content;
          }
        } catch (e) {
          if (e instanceof AIError) throw e;
          // skip malformed SSE lines
        }
      }
    }

    if (!yielded) {
      throw new AIError('Model returned an empty response', 502);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamChat(options: StreamChatOptions): AsyncIterable<string> {
  const { apiKey, model = DEFAULT_MODEL, messages, signal } = options;

  // If user picked a specific non-default model, don't fallback
  const isFreeDefault = !model || model === DEFAULT_MODEL || FREE_FALLBACK_MODELS.includes(model);

  if (!isFreeDefault) {
    yield* streamChatSingle(apiKey, model, messages, signal);
    return;
  }

  // Try free models in order until one works
  const modelsToTry = model && model !== DEFAULT_MODEL
    ? [model, ...FREE_FALLBACK_MODELS.filter((m) => m !== model)]
    : FREE_FALLBACK_MODELS;

  let lastError: Error | null = null;
  for (const candidate of modelsToTry) {
    try {
      yield* streamChatSingle(apiKey, candidate, messages, signal);
      return;
    } catch (e) {
      // Don't retry auth errors or user aborts
      if (e instanceof AIError && e.status === 401) throw e;
      if (e instanceof Error && e.name === 'AbortError') throw e;
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new AIError('All AI models are currently unavailable. Try again later.', 503);
}

export async function testConnection(apiKey: string, model?: string): Promise<boolean> {
  try {
    const gen = streamChat({
      apiKey,
      model,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    // Read at least one chunk
    const iterator = gen[Symbol.asyncIterator]();
    const first = await iterator.next();
    return !first.done;
  } catch {
    return false;
  }
}
