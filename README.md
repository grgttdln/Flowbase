# Flowbase

An AI-powered infinite canvas for creating flowcharts, diagrams, and visual workflows. Fast, minimal, and collaborative — no learning curve, no clutter.

## Features

- **Infinite Canvas** — Zoom (10%–800%), pan, snap-to-grid, smart alignment guides
- **Rich Elements** — Rectangles, circles, diamonds, text, sticky notes, freehand drawing, connectors with auto-routing
- **Real-time Collaboration** — WebSocket + Yjs CRDT sync, live cursors, presence awareness, room-based sessions
- **AI Assistant** — Generate and enhance diagrams from natural language via OpenRouter (streaming)
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
| Styling | Tailwind CSS v4 |
| Monorepo | Turborepo, pnpm workspaces |

## Project Structure

```
Flowbase/
├── apps/
│   └── web/                  # Next.js application
├── packages/
│   ├── shared/               # Shared types, constants, validation
│   ├── canvas/               # Konva-based canvas rendering & tools
│   ├── collab/               # WebSocket collaboration server (standalone)
│   └── ai/                   # AI prompt building & response parsing
├── turbo.json
└── package.json
```

## Getting Started

### 1. Prerequisites

- **Node.js** 18 or newer
- **pnpm** 10.6+ (the repo pins `pnpm@10.6.5` via `packageManager`)

If you don't have pnpm:

```bash
npm install -g pnpm@10.6.5
# or
corepack enable && corepack prepare pnpm@10.6.5 --activate
```

### 2. Install dependencies

From the repo root:

```bash
pnpm install
```

This installs dependencies for every workspace (`apps/web`, `packages/*`).

### 3. Configure environment (optional)

Flowbase runs out of the box with **no environment variables** — defaults assume local development on `localhost:3000` and `ws://localhost:4444`.

You only need a `.env.local` if you want to override the collab server URL (e.g. pointing the web app at a remote collab server). Create `apps/web/.env.local`:

```bash
# apps/web/.env.local
NEXT_PUBLIC_COLLAB_URL=ws://localhost:4444
```

The OpenRouter API key for the AI Assistant is **not** an env var — users enter it at runtime via the in-app **Settings** panel, and it's stored in the browser's `localStorage`. This keeps the key on the user's machine and avoids bundling it into the client.

### 4. Run in development

```bash
pnpm dev
```

Turborepo starts both services in parallel:

| Service | URL | Notes |
|---------|-----|-------|
| Web app (Next.js) | http://localhost:3000 | Main UI |
| Collab server (Yjs/WebSocket) | ws://localhost:4444 | Required for real-time collab |

Open http://localhost:3000 to use the app. To enable the AI Assistant, open **Settings** in the app and paste an OpenRouter API key (get one at https://openrouter.ai/keys).

### 5. Build for production

```bash
pnpm build
```

Builds every workspace. The web app output lands in `apps/web/.next/`; the collab server compiles to `packages/collab/dist/`.

To run the production build:

```bash
# Terminal 1 — web app
pnpm --filter web start

# Terminal 2 — collab server
pnpm --filter @flowbase/collab start
```

### 6. Lint & format

```bash
pnpm lint
pnpm format
```

## Environment Variables

All variables are optional.

| Variable | Scope | Default | Description |
|----------|-------|---------|-------------|
| `NEXT_PUBLIC_COLLAB_URL` | `apps/web` | `ws://localhost:4444` | WebSocket URL the client connects to for collab rooms |
| `PORT` | `packages/collab` | `4444` | Port the collab server listens on |
| `HOST` | `packages/collab` | `0.0.0.0` | Host the collab server binds to |

Where to put them:

- **Web app vars** → `apps/web/.env.local` (Next.js auto-loads this; `NEXT_PUBLIC_*` is exposed to the browser)
- **Collab server vars** → shell env when launching the process, or a process manager / container env

## Collaboration Server

The collab server (`packages/collab`) is a standalone Node.js process using Yjs for CRDT-based state sync over WebSocket.

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check — returns `{ status: "ok" }` |
| `GET /rooms` | List active rooms |
| `ws://host:port/rooms/:roomId` | WebSocket connection for a room |

### Running standalone (without the web app)

```bash
cd packages/collab
pnpm dev              # development with tsx watch
# or
pnpm build && pnpm start
```

### Running via Docker

A `Dockerfile` is included:

```bash
cd packages/collab
docker build -t flowbase-collab .
docker run -p 4444:4444 flowbase-collab
```

## Deployment

- **Web app**: deploy `apps/web` to any Next.js-compatible host (Vercel, Netlify, self-hosted Node). Set `NEXT_PUBLIC_COLLAB_URL` to your public collab server URL (use `wss://` in production).
- **Collab server**: deploy `packages/collab` as a long-running Node process. WebSocket support is required — serverless/edge runtimes without persistent connections will not work.

## License

MIT
