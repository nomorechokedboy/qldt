# QLHV Web

Frontend for **QLHV** (trainee/personnel management). React + Vite + TanStack Router/Query, talking to [`apps/api`](../api/README.md).

## Prerequisites

- Node.js 20+, pnpm (see the [root README](../../README.md))
- A running `apps/api` instance to point at (see [`apps/api/README.md`](../api/README.md))

## Configuration

Env vars are validated via [`@t3-oss/env-core`](https://env.t3.gg) in `src/env.ts` and must be prefixed `VITE_` to reach the client bundle (Vite convention):

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | `''` (same-origin) | Base URL of `apps/api` |
| `VITE_APP_TITLE` | no | — | App title, if used in the UI |

Create `apps/web/.env` (or `.env.local`) for local overrides — Vite loads it automatically.

## Running locally

```bash
cd apps/web
pnpm dev      # http://localhost:3000 (alias: pnpm start)
```

```bash
pnpm build    # production build → dist/
pnpm serve    # preview the production build locally
pnpm test     # vitest run
pnpm lint     # biome lint
pnpm format   # biome format
pnpm check    # biome check (lint + format, no fix)
```

## Architecture

- **Routing**: [TanStack Router](https://tanstack.com/router), file-based under `src/routes/` (~24 route files) — adding a file adds a route; `src/routes/__root.tsx` is the shared layout.
- **Data fetching**: [TanStack Query](https://tanstack.com/query) via hooks in `src/hooks/`, calling a typed Encore client.
- **API client**: `src/api/index.ts` wraps `src/api/client.ts` (**generated**, not hand-written — regenerate it from `apps/api` with `pnpm gen` there whenever an endpoint changes) in small typed functions per feature area (students, classes, units, materials, transfer-requests, roles/permissions, audit-logs, etc.).
- **UI components**: shared primitives come from `@repo/ui` (`packages/ui`, shadcn/Radix-based); app-specific components live in `src/components/`.
- **Styling**: Tailwind CSS.
- **State/business logic**: `src/biz/` (domain logic not tied to a specific component), `src/common/`, `src/data/`, `src/types/`.
- **Integrations**: `src/integrations/` (e.g. query client setup).
- **i18n**: UI strings are largely Vietnamese (the system's users don't read English) — see other apps' `i18n`/`lang` conventions if adding new user-facing strings.

## Directory reference

```
apps/web/
├── src/
│   ├── routes/          File-based TanStack Router routes
│   ├── api/               Generated Encore client (client.ts) + hand-written wrappers (index.ts)
│   ├── hooks/              TanStack Query hooks per feature
│   ├── components/         App-specific React components
│   ├── biz/                 Domain/business logic
│   ├── common/, data/, lib/, types/, assets/, integrations/
│   └── env.ts               Typed env var validation
├── public/                Static assets
├── index.html              Vite entry HTML
├── vite.config.ts
├── components.json         shadcn config
├── biome.json               Biome lint/format config
└── Dockerfile               Multi-stage: turbo-pruned pnpm build → static nginx image
```

## Docker

```bash
docker build -t <your-tag>:web -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com .
```

Build from the **repo root** (not `apps/web/`) — the Dockerfile runs `turbo prune web --docker` against the full monorepo first to produce a minimal pruned workspace, then builds and serves the static output via nginx. `VITE_API_URL` must be passed as a `--build-arg` since Vite bakes client env vars into the bundle at build time, not read at container start.
