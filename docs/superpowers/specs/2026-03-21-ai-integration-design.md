# Phase 6: AI Integration Design

**Date:** 2026-03-21
**Status:** Approved

## Summary

Wire up AI-powered Explain, Suggest, and Summarize actions in Flowbase using OpenRouter with free models. Single provider, direct `fetch` streaming, no SDK dependencies.

## Decisions

- **Provider:** OpenRouter only (no multi-provider architecture)
- **Default model:** `nvidia/nemotron-3-super-120b-a12b:free`
- **Users can override** the model ID to any OpenRouter model in settings
- **No SDK:** Direct `fetch` to OpenRouter's OpenAI-compatible endpoint
- **API key handling:** Stored in `localStorage`, sent via `Authorization` header to our API route, proxied to OpenRouter
- **Streaming:** SSE from API route to browser

## Architecture

```
Right-click element -> Context menu (Explain / Suggest / Summarize)
    |
    v
Serialize selection -> Build prompt (action-specific)
    |
    v
POST /api/ai { action, scene, selectedIds }
  (API key in Authorization header, model in X-Model header)
    |
    v
Next.js API route validates request -> fetch OpenRouter (stream: true)
    |
    v
SSE piped back to browser
    |
    v
AIResponsePopover renders streaming text
```

The Next.js API route is a passthrough proxy. It exists to avoid exposing OpenRouter URLs to the browser and to enable future rate limiting.

**Concurrent requests:** A new AI action auto-aborts any in-flight request. Only one AI action runs at a time.

## Type Changes to `@flowbase/shared`

### Before (`packages/shared/src/types/ai.ts`)

```ts
export type AIActionType = 'explain' | 'suggest' | 'summarize';
export interface AIModel { id: string; name: string; supportsVision: boolean; }
export interface AIRequest { action: AIActionType; scene: SerializedScene; selectedIds?: string[]; apiKey: string; }
export interface AIProvider { id: string; name: string; models: AIModel[]; analyze(...): AsyncIterable<string>; testConnection(...): Promise<boolean>; }
```

### After

```ts
export type AIActionType = 'explain' | 'suggest' | 'summarize';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  action: AIActionType;
  scene: SerializedScene;
  selectedIds?: string[];
}
```

- **Removed:** `AIProvider`, `AIModel` (no multi-provider architecture)
- **Removed:** `apiKey` from `AIRequest` (travels via `Authorization` header, not in the body)
- **Added:** `ChatMessage` type used by `streamChat`

`packages/shared/src/index.ts` barrel export updated to match.

## Package Structure

### `packages/ai/src/`

```
index.ts              - public exports
openrouter.ts         - fetch to OpenRouter, returns AsyncIterable<string>
serializer.ts         - converts Element[] to structured text prompt
prompts.ts            - prompt templates for explain/suggest/summarize
```

### `openrouter.ts`

Single exported function:

```ts
streamChat(options: {
  apiKey: string;
  model: string;       // defaults to "nvidia/nemotron-3-super-120b-a12b:free"
  messages: ChatMessage[];
}): AsyncIterable<string>
```

- Calls `https://openrouter.ai/api/v1/chat/completions` with `stream: true`
- Sets `HTTP-Referer` and `X-Title` headers per OpenRouter requirements
- Parses SSE `data:` lines, yields content deltas
- Throws typed errors for auth failures (401), rate limits (429), network issues

Standalone test function (used by Settings panel):

```ts
testConnection(apiKey: string, model: string): Promise<boolean>
```

Sends a minimal prompt ("Say hi") and returns true if a response is received.

### `serializer.ts`

Single function:

```ts
serializeElements(elements: Element[]): string
```

- Takes a pre-filtered array of elements (caller decides whether to filter by selection or viewport)
- Serializes each element by type, position, size, color, and text content
- Arrows are serialized by their position and points (e.g., "Arrow at (100, 200) pointing right, 2 segments") since `Element` has no connection/binding data — spatial relationships are left to the AI model to infer from positions
- Truncation: max 50 elements. If truncated, appends a note so the model knows the scene is partial

Output format example:

```
Canvas contains 3 elements:
1. Rectangle at (100, 50), size 140x56, fill: none, stroke: blue, text: "User Service"
2. Rectangle at (280, 50), size 140x56, fill: none, stroke: red, text: "Database"
3. Arrow at (240, 78), 2 points, stroke: black
```

Selection vs. viewport filtering happens at the call site (API route), not in the serializer.

### `prompts.ts`

Builds system + user messages per action:

- **Explain:** "Describe what this diagram/selection represents..."
- **Suggest:** "Suggest improvements to this diagram..."
- **Summarize:** "Provide a concise summary of this canvas..."

## API Route

**`apps/web/src/app/api/ai/route.ts`** - POST handler:

- Validates request body: `action` must be one of the three known types, `scene` must have `elements` array, `selectedIds` must be string array if present. Rejects with 400 on malformed input. Max payload size enforced by Next.js config.
- Reads API key from `Authorization` header (returns 401 if missing)
- Filters elements by `selectedIds` (for Explain/Suggest) or passes all elements (for Summarize)
- Calls serializer -> builds prompt -> calls `streamChat`
- Returns a `ReadableStream` response with `content-type: text/event-stream`
- Error responses: 400 (bad request), 401 (no/invalid key), 429 (rate limited), 500 (provider down)

## Client-Side

### `apps/web/src/hooks/useAIAction.ts`

```ts
useAIAction() -> {
  run(action, scene, selectedIds?): void
  text: string          // accumulated streamed text
  isLoading: boolean
  error: string | null
  abort(): void         // cancels in-flight request
}
```

- Reads `apiKey` and `modelId` from `localStorage` internally
- Fetches `/api/ai` with `AbortController`
- Calling `run()` while a request is in-flight aborts the previous request
- Reads SSE stream, appends to `text` state as chunks arrive

### `apps/web/src/components/ai/AIResponsePopover.tsx`

- Positioned near the selection (anchored to selection bounding box)
- Streams markdown text (simple rendering, no heavy lib)
- Dismiss button (X) and copy-to-clipboard button
- Loading shimmer while waiting for first chunk
- Error state shows inline message with retry button
- Accessibility: `role="dialog"`, `aria-live="polite"` on the streaming text region

### `apps/web/src/components/dialogs/SettingsPanel.tsx`

- API key input (password field, stored in localStorage)
- Model ID text field (defaults to `nvidia/nemotron-3-super-120b-a12b:free`)
- "Test Connection" button - calls `testConnection()` from `@flowbase/ai`, shows success/failure
- Accessible from toolbar

## Error Handling

All errors shown as non-blocking toasts, except in-popover errors:

| Scenario | Behavior |
|----------|----------|
| No API key set | Open settings panel with hint instead of popover |
| Invalid API key (401) | Toast: "Invalid API key. Check your settings." |
| Rate limited (429) | Toast: "Rate limited. Try again in a moment." |
| Provider down (5xx/network) | Toast: "AI service unavailable. Try again later." |
| Streaming interrupted | `AbortController.abort()` cleans up |
| Scene too large | Serializer truncates to 50 elements, notes truncation in prompt |
| Malformed request (400) | Toast: "Something went wrong. Try again." |

Empty selection for Explain/Suggest cannot occur - context menu hides those items when nothing is selected.

## Existing Code Integration

- **`@flowbase/shared` types** - See "Type Changes" section above for the full before/after
- **Context menu** - Already has Explain/Suggest/Summarize actions with `isAI: true`. We wire `onAction` to call `useAIAction.run()`.
- **`@flowbase/ai` package** - Currently a stub. We populate it with the modules described above.
- **`CanvasEditor.tsx`** - Already has `onSettings={() => {/* Phase 6 */}}` placeholder ready to wire up.

## Files to Create/Modify

**Create:**
- `packages/ai/src/openrouter.ts`
- `packages/ai/src/serializer.ts`
- `packages/ai/src/prompts.ts`
- `apps/web/src/app/api/ai/route.ts`
- `apps/web/src/hooks/useAIAction.ts`
- `apps/web/src/components/ai/AIResponsePopover.tsx`
- `apps/web/src/components/dialogs/SettingsPanel.tsx`

**Modify:**
- `packages/ai/src/index.ts` - replace stub with real exports
- `packages/ai/package.json` - no new dependencies needed
- `packages/shared/src/types/ai.ts` - see Type Changes section
- `packages/shared/src/index.ts` - update barrel exports (remove AIProvider, AIModel; add ChatMessage)
- `apps/web/src/components/canvas/CanvasEditor.tsx` - integrate AI actions, popover, settings
- `apps/web/src/components/canvas/ContextMenu.tsx` - wire AI actions to handler

## Out of Scope

- Vision/image-based analysis (text serialization only)
- Multi-provider support (OpenRouter only)
- Server-side API key storage
- Conversation history / follow-up questions
- AI-generated diagram modifications (read-only analysis)
- Arrow connection/binding data (arrows serialized by position, AI infers relationships)
