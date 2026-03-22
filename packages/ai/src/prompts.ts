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
  generate:
    'You are a diagramming assistant that generates canvas elements from descriptions. ' +
    'The user will describe a diagram they want. Respond with ONLY a JSON object (no markdown, no explanation) ' +
    'in this exact format:\n' +
    '{"elements": [...]}\n\n' +
    'Each element must have these fields:\n' +
    '- "type": one of "rectangle", "ellipse", "diamond", "text", "arrow"\n' +
    '- "x": number (x position)\n' +
    '- "y": number (y position)\n' +
    '- "width": number (element width, min 40)\n' +
    '- "height": number (element height, min 20)\n' +
    '- "text": string (optional label inside the shape)\n' +
    '- "fill": string (optional CSS color for background, e.g. "#E7F5FF")\n' +
    '- "stroke": string (optional CSS color for border, e.g. "#1971C2")\n\n' +
    'For arrows, also include:\n' +
    '- "points": [startX, startY, endX, endY] (relative to x,y position, e.g. [0, 0, 80, 0] for a horizontal arrow)\n\n' +
    'Layout guidelines:\n' +
    '- Space elements at least 40px apart\n' +
    '- Use a clean grid layout (flowcharts: top-to-bottom or left-to-right)\n' +
    '- Place arrows between the shapes they connect\n' +
    '- Use soft pastel fills with matching darker strokes\n' +
    '- Keep text labels concise (1-3 words)\n' +
    '- Start positions near (100, 100) and expand outward\n\n' +
    'Respond with ONLY the JSON object. No markdown code fences, no explanations.',
};

export function buildMessages(action: AIActionType, userContent: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPTS[action] },
    { role: 'user', content: userContent },
  ];
}
