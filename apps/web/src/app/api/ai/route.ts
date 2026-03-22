import { NextRequest } from 'next/server';
import { streamChat, serializeElements, buildMessages, AIError } from '@flowbase/ai';
import type { AIActionType, Element } from '@flowbase/shared';

const VALID_ACTIONS: AIActionType[] = ['explain', 'suggest', 'summarize', 'generate'];

export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'API key required' }, { status: 401 });
  }
  const apiKey = authHeader.slice(7);

  // Parse body
  let body: { action?: string; scene?: { elements?: Element[] }; selectedIds?: string[]; model?: string; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate
  const { action, scene, selectedIds, model, prompt } = body;
  if (!action || !VALID_ACTIONS.includes(action as AIActionType)) {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Build prompt based on action type
  let messages;
  if (action === 'generate') {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return Response.json({ error: 'Prompt required for generate action' }, { status: 400 });
    }
    messages = buildMessages('generate', prompt.trim());
  } else {
    if (!scene?.elements || !Array.isArray(scene.elements)) {
      return Response.json({ error: 'Invalid scene' }, { status: 400 });
    }
    if (selectedIds && !Array.isArray(selectedIds)) {
      return Response.json({ error: 'Invalid selectedIds' }, { status: 400 });
    }

    let elements = scene.elements;
    if (selectedIds && selectedIds.length > 0) {
      const idSet = new Set(selectedIds);
      elements = elements.filter((el) => idSet.has(el.id));
    }

    if (elements.length === 0) {
      return Response.json({ error: 'No elements to analyze' }, { status: 400 });
    }

    const serialized = serializeElements(elements);
    messages = buildMessages(action as AIActionType, serialized);
  }

  // Stream response
  try {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat({ apiKey, model, messages })) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          if (err instanceof AIError) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ error: err.message })}\n\n`),
            );
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    if (err instanceof AIError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return Response.json({ error: 'AI service unavailable. Try again later.' }, { status: 500 });
  }
}
