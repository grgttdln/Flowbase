import type { ChatMessage } from '@flowbase/shared';

export const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

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

export async function* streamChat(options: StreamChatOptions): AsyncIterable<string> {
  const { apiKey, model = DEFAULT_MODEL, messages, signal } = options;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://flowbase.app',
      'X-Title': 'Flowbase',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 401) throw new AIError('Invalid API key. Check your settings.', 401);
    if (response.status === 429) throw new AIError('Rate limited. Try again in a moment.', 429);
    throw new AIError(text || 'AI service unavailable. Try again later.', response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new AIError('No response body', 500);

  const decoder = new TextDecoder();
  let buffer = '';

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
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
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
