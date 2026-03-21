import type { AIActionType, ChatMessage } from '@flowbase/shared';

const SYSTEM_PROMPTS: Record<AIActionType, string> = {
  explain:
    'You are a diagramming assistant. The user will describe elements on a canvas. ' +
    'Explain what the diagram or selection represents. Be concise and insightful. ' +
    'Infer relationships from spatial positions (e.g., arrows near shapes likely connect them).',
  suggest:
    'You are a diagramming assistant. The user will describe elements on a canvas. ' +
    'Suggest concrete improvements to the diagram: layout, missing elements, clearer labels, ' +
    'better grouping, or structural changes. Be specific and actionable.',
  summarize:
    'You are a diagramming assistant. The user will describe elements on a canvas. ' +
    'Provide a concise summary of what this canvas represents. ' +
    'Focus on the big picture and key relationships between elements.',
};

export function buildMessages(action: AIActionType, serializedScene: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPTS[action] },
    { role: 'user', content: serializedScene },
  ];
}
