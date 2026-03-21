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
  (API key in Authorization header)
    |
    v
Next.js API route -> fetch OpenRouter /api/v1/chat/completions (stream: true)
    |
    v
SSE piped back to browser
    |
    v
AIResponsePopover renders streaming text
```

The Next.js API route is a passthrough proxy. It exists to avoid exposing OpenRouter URLs to the browser and to enable future rate limiting.

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

### `serializer.ts`

Two functions:

- `serializeSelection(scene, selectedIds)` - serializes only selected elements into structured text
- `serializeViewport(scene, viewport)` - serializes elements visible in the current viewport (for Summarize on large canvases)

Output format:

```
Canvas contains 3 elements:
1. Rectangle "User Service" at (100, 50), size 140x56, blue border
2. Rectangle "Database" at (280, 50), size 140x56, red border
3. Arrow from "User Service" to "Database"
```

Truncation: serialize up to 50 elements max. If truncated, include a note in the prompt so the model knows the scene is partial.

### `prompts.ts`

Builds system + user messages per action:

- **Explain:** "Describe what this diagram/selection represents..."
- **Suggest:** "Suggest improvements to this diagram..."
- **Summarize:** "Provide a concise summary of this canvas..."

## API Route

**`apps/web/src/app/api/ai/route.ts`** - POST handler:

- Reads `action`, `scene`, `selectedIds` from request body
- Reads API key from `Authorization` header
- Calls serializer -> builds prompt -> calls `streamChat`
- Returns a `ReadableStream` response with `content-type: text/event-stream`
- Error responses: 401 (no/invalid key), 429 (rate limited), 500 (provider down)

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

- Fetches `/api/ai` with `AbortController`
- Reads SSE stream, appends to `text` state as chunks arrive

### `apps/web/src/components/ai/AIResponsePopover.tsx`

- Positioned near the selection (anchored to selection bounding box)
- Streams markdown text (simple rendering, no heavy lib)
- Dismiss button (X) and copy-to-clipboard button
- Loading shimmer while waiting for first chunk
- Error state shows inline message with retry button

### `apps/web/src/components/dialogs/SettingsPanel.tsx`

- API key input (password field, stored in localStorage)
- Model ID text field (defaults to `nvidia/nemotron-3-super-120b-a12b:free`)
- "Test Connection" button - sends a tiny prompt, shows success/failure
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

Empty selection for Explain/Suggest cannot occur - context menu hides those items when nothing is selected.

## Existing Code Integration

- **`@flowbase/shared` types** (`AIProvider`, `AIRequest`, etc.) - The existing `AIProvider` interface assumes multi-provider. We'll simplify: remove the interface-based provider pattern and export simple function types instead. The `AIActionType` and `AIRequest` types stay as-is.
- **Context menu** - Already has Explain/Suggest/Summarize actions with `isAI: true`. We wire `onAction` to call `useAIAction.run()`.
- **`@flowbase/ai` package** - Currently a stub. We populate it with the modules described above.

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
- `packages/shared/src/types/ai.ts` - simplify types (drop `AIProvider` interface, keep action/request types)
- `apps/web/src/components/canvas/CanvasEditor.tsx` - integrate AI actions, popover, settings
- `apps/web/src/components/canvas/ContextMenu.tsx` - wire AI actions to handler

## Out of Scope

- Vision/image-based analysis (text serialization only)
- Multi-provider support (OpenRouter only)
- Server-side API key storage
- Conversation history / follow-up questions
- AI-generated diagram modifications (read-only analysis)
