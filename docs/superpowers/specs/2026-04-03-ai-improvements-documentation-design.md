# AI Improvements Documentation — Design Spec

**Date:** 2026-04-03
**Purpose:** Create Obsidian Vault documentation that captures the current state of Flowbase's 5 AI features as a baseline for planning prompt and behavior improvements.

## Target Location

```
/Users/georgette/Documents/Obsidian Vault/Flowbase/Documentation/
├── AI Overview.md
├── Generate Diagram.md
├── Explain.md
├── Suggest Improvements.md
├── Summarize.md
└── Auto-Layout.md
```

## Audience & Use

Personal planning documentation. The user will use these docs to:
1. Review current prompt text with annotations
2. Track known issues per feature
3. Work through improvement checklists

## AI Overview.md

Covers shared infrastructure across all 5 features:

- **Architecture** — text-based diagram showing: Context Menu → CanvasEditor → useAIAction hook → /api/ai route → @flowbase/ai package → OpenRouter API
- **Provider** — OpenRouter, default model `nvidia/nemotron-3-super-120b-a12b:free`, auth via localStorage
- **Serialization** — how `serializeElements()` converts canvas to natural language (50-element cap, describes type/position/size/colors/text/bindings/groups) and `serializeForLayout()` converts to structured JSON
- **Response Handling** — SSE streaming, parser for JSON extraction (markdown code block stripping, regex fallback), validation and clamping
- **Error Handling** — 401/429/5xx mapping, client-side parse errors
- **Cross-Feature Improvement Checklist** — items that affect all features (model selection, serialization fidelity, token efficiency, element cap)

## Per-Feature Files

Each file follows this template:

### 1. Summary
What the feature does, context menu visibility conditions, user-facing behavior.

### 2. Data Flow
Step-by-step: user action → serialization → API call → prompt construction → streaming → response handling → UI update.

### 3. Current Prompt (Full Text)
The exact system prompt from `packages/ai/src/prompts.ts` in a code block.

### 4. Prompt Annotations
Inline analysis broken into sections:
- **What this does** — purpose of each prompt section
- **What works** — parts that produce good results
- **What's fragile** — parts that frequently fail or produce inconsistent results
- **Improvement ideas** — specific, actionable changes

### 5. Known Issues
Bullet list for logging observed problems. Pre-populated where issues are apparent from code analysis (e.g., 50-element truncation, position inference from spatial proximity). Empty bullets with `<!-- Add issues here -->` placeholder for user to fill in from experience.

### 6. Improvement Checklist
`- [ ]` items — specific, actionable improvements derived from the prompt annotations. Each item describes what to change and why.

### 7. Code References
File paths with descriptions for quick navigation back to source.

## Feature-Specific Content

### Generate Diagram
- Longest and most complex prompt (strict JSON format, layout rules, arrow positioning, color palette)
- Parser: `parseGeneratedElements()` with type validation, coordinate clamping, color validation
- Key annotations: rigid size constraints, center-alignment math, arrow positioning rules, loop/branch routing
- Improvement areas: prompt is very long (token-heavy), layout rules are prescriptive but brittle, no support for horizontal flows or complex topologies, color palette guidance is vague ("soft pastel"), text truncated to 200 chars

### Explain
- Shortest prompt (3 sentences)
- Relies on spatial inference ("arrows near shapes likely connect them")
- Key annotations: no structural understanding of bindings (prompt gets text description, not connection data), vague "concise and insightful" instruction
- Improvement areas: leverage binding data in serialization, add domain-specific interpretation guidance, specify output format

### Suggest Improvements
- Similar to Explain but action-oriented
- Key annotations: lists 5 improvement categories but no prioritization guidance, no awareness of diagram type/domain
- Improvement areas: add diagram-type detection, prioritize suggestions, specify output structure (numbered list vs prose)

### Summarize
- Simplest prompt — "big picture and key relationships"
- Key annotations: no guidance on summary length or structure, no hierarchy detection
- Improvement areas: specify output length, add structural analysis (layers, clusters, flow direction), distinguish between diagram types

### Auto-Layout
- Two-part system: structured JSON input via `serializeForLayout()`, structured JSON output
- Parser: `parseLayoutResponse()` with ID validation against existing canvas elements
- Key annotations: 9 explicit layout rules, handles groupId clustering, excludes bound arrows, 80px spacing
- Improvement areas: no awareness of diagram type (flowchart vs network vs org chart), no handling of bidirectional connections, grid layout fallback is unguided, animation is fixed 300ms

## What Is NOT In Scope

- No new features — only documenting and improving existing 5
- No infrastructure changes (provider, auth, streaming) unless a checklist item requires it
- No UI changes to the AI components
- No code changes — documentation only, checklists guide future implementation
