# Flowbase

An AI-powered infinite canvas for creating flowcharts, diagrams, and visual workflows. Fast, minimal, and collaborative — no learning curve, no clutter.

## Features

- **Infinite Canvas** — Zoom (10%–800%), pan, snap-to-grid, smart alignment guides
- **Rich Elements** — Rectangles, circles, diamonds, text, sticky notes, freehand drawing, connectors with auto-routing
- **Real-time Collaboration** — WebSocket + Yjs CRDT sync, live cursors, presence awareness, room-based sessions
- **AI Assistant** — Generate and enhance diagrams from natural language via OpenRouter
- **Local-first** — Projects stored in IndexedDB, no account required
- **Export** — PNG and SVG
- **Templates** — Flowchart, Org Chart, Mindmap, Wireframe, Kanban, Timeline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Canvas | Konva.js + react-konva |
| State | Zustand |
| Collaboration | Yjs, y-websocket, WebSocket server |
| AI | OpenRouter API (streaming) |
| Storage | IndexedDB (idb) |
| Styling | Tailwind CSS |
| Monorepo | Turborepo, pnpm workspaces |

## Project Structure

```
Flowbase/
├── apps/
│   └── web/                  # Next.js application
├── packages/
│   ├── shared/               # Shared types, constants, validation
│   ├── canvas/               # Konva-based canvas rendering & tools
│   ├── collab/               # WebSocket collaboration server
│   └── ai/                   # AI prompt building & response parsing
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.6+

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

This starts:
- **Web app** at `http://localhost:3000`
- **Collab server** at `ws://localhost:4444`

### Build

```bash
pnpm build
```

### Lint & Format

```bash
pnpm lint
pnpm format
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | For AI features | OpenRouter API key |
| `COLLAB_SERVER_URL` | No | WebSocket server URL (defaults to same domain) |
| `PORT` | No | Collab server port (default: `4444`) |
| `HOST` | No | Collab server host (default: `0.0.0.0`) |

## Collaboration Server

The collab server (`packages/collab`) runs as a standalone Node.js process with Yjs for CRDT-based state sync.

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /rooms` | List active rooms |
| `ws://host:port/rooms/:roomId` | WebSocket connection |

## License

MIT
