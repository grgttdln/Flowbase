# Flowbase Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Overview

Flowbase is an AI-powered whiteboard web application. Users draw diagrams, flowcharts, wireframes, and sketches on an infinite canvas, then use AI to understand and analyze what they've created. The AI doesn't generate drawings — it reads the canvas and provides explanations, suggestions, and summaries through a right-click context menu.

**Target audience:** Developers, designers, students, educators, and general knowledge workers.

---

## Architecture

**Modular monolith** using Turborepo. Separate packages with clean boundaries, deployed as a single Next.js application.

```
flowbase/
├── apps/
│   └── web/                  # Next.js app (pages, layouts, UI shell)
├── packages/
│   ├── canvas/               # Konva canvas engine
│   ├── ai/                   # AI service layer (provider-agnostic)
│   └── shared/               # Shared types, utils, constants
├── turbo.json
├── package.json
└── tsconfig.json
```

### apps/web
The Next.js application. Handles routing, layout, toolbar UI, context menus, export dialogs, and settings. Uses `react-konva` to render the canvas. API routes proxy AI requests to keep provider keys server-side.

### packages/canvas
The drawing engine. Manages shapes, layers, selection, undo/redo, zoom/pan, snapping, and grouping. Exports React components and hooks. Has no AI awareness — it simply exposes its state as serializable JSON.

### packages/ai
AI service abstraction. Takes a canvas snapshot (serialized scene), constructs prompts, sends requests via API routes, and returns structured responses. Provider-agnostic interface allows swapping between OpenAI, Anthropic, or other providers without changing canvas or UI code.

### packages/shared
TypeScript types, constants, and utility functions shared across all packages.

---

## Canvas Engine (packages/canvas)

### Shape Tools
- Rectangle
- Ellipse
- Diamond
- Line
- Arrow
- Freehand draw
- Text

### Core Capabilities
- **Selection** — Click to select, drag to multi-select, shift+click to add to selection
- **Manipulation** — Move, resize, rotate, delete, copy/paste
- **Layers** — Z-order management (bring forward, send back)
- **Zoom/Pan** — Scroll to zoom, drag canvas to pan
- **Undo/Redo** — Command pattern stack for all actions
- **Snapping** — Snap to grid, snap to edges/centers of other shapes
- **Grouping** — Group/ungroup elements

### Scene Serialization
The canvas state is serializable to JSON. This is the format used for:
- Saving to IndexedDB
- Exporting as `.flowbase` files
- Sending to the AI service for analysis

---

## AI Service (packages/ai)

### Provider-Agnostic Interface
A common `AIProvider` interface that any provider can implement. Provider configuration (selected provider + API key) is stored in localStorage. Users configure this in a settings panel.

### Canvas-to-AI Pipeline
1. User right-clicks element(s) — context menu appears
2. User picks an action (Explain / Suggest Improvements / Summarize)
3. The AI package serializes the selected elements (or full canvas) into a structured prompt
4. Request goes to Next.js API route — forwards to AI provider
5. Response streams back and displays in a floating popover near the selection

### Context Menu Actions
- **Explain** — "What does this diagram/element represent?" Returns a natural language explanation
- **Suggest Improvements** — "How could this diagram be clearer or more complete?" Returns actionable suggestions
- **Summarize** — "Give a concise summary of what's on the canvas." Works on selection or entire canvas

### API Key Handling
- User enters their own API key in a settings panel
- Key stored in localStorage (no backend servers)
- Next.js API route proxies requests so the key doesn't appear in browser network calls

---

## UI Design

### Style
iOS-inspired light mode:
- White canvas with subtle dot grid
- Floating pill-shaped toolbars with soft shadows
- System blue (#007AFF) as accent color
- Rounded corners (10-14px) throughout
- No hard borders — soft box shadows for elevation

### Layout
- **Logo** — Top-left floating pill ("Flowbase")
- **Center toolbar** — Floating icon-based tool picker (cursor, rect, ellipse, diamond | line, arrow | pencil, text). Tools grouped by type with subtle dividers
- **Top-right actions** — Icon buttons: undo/redo group, export, settings
- **Canvas** — Full-screen white canvas, fills all remaining space
- **Context menu** — iOS-style rounded menu. AI actions (blue, with sparkle icon) at top, standard actions (Copy, Delete, Group) below a divider
- **AI response** — Floating popover near the selection, dismissible
- **Zoom controls** — Bottom-left floating pill with -/+/percentage
- **Save indicator** — Bottom-right ("Saved" in green)

No sidebar. Minimal, canvas-focused interface.

---

## Storage & Export

### Local Storage
- Canvas state auto-saved to IndexedDB on change
- Multiple projects supported — project list on home screen
- Each project stores: name, canvas scene JSON, thumbnail, last modified date

### Export Formats
- **Flowbase JSON** (.flowbase) — native format for save/load, full scene data
- **PNG** — rasterized canvas export via Konva's `toDataURL()`
- **SVG** — vector export via Konva's `toSVG()`
- **Code** — future feature (not in initial version, but export interface is extensible)

### Import
- Load from `.flowbase` JSON files
- Drag and drop files onto canvas to import

---

## Error Handling

- **AI failures** — Non-intrusive toast notification ("Couldn't reach AI. Check your API key in Settings."). Never blocks the canvas.
- **No API key configured** — AI context menu items are visible but prompt to add an API key when clicked.
- **Large canvas** — Serialize only selected elements for AI actions (or viewport snapshot for Summarize) to avoid exceeding token limits.
- **IndexedDB quota** — Warn user and suggest exporting projects as `.flowbase` files.
- **Corrupted save files** — Validate JSON schema on import, show clear error if file is invalid.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Canvas | Konva + react-konva |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Local Storage | IndexedDB via idb |
| AI Layer | Provider-agnostic interface, API routes as proxy |
| Monorepo | Turborepo |
| Package Manager | pnpm |
| Icons | Lucide React |

### Development Tooling
- **skills.sh** — AI agent skills directory for enhanced development workflow

---

## What's NOT in V1

- Real-time collaboration / multiplayer
- User authentication / accounts
- Cloud storage / sync
- "Convert to code" AI action (future)
- Desktop app (Electron)
- Dark mode (can be added later)
- Image import / embedding
- Templates / pre-built shapes
