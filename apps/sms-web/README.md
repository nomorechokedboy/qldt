# SMS Web

Frontend for **SMS** (Student Management System). React + Vite + TanStack Router/Query, talking to [`apps/sms-api`](../sms-api/README.md), which in turn talks to Moodle.

## Prerequisites

- Node.js 20+, pnpm (see the [root README](../../README.md))
- A running `apps/sms-api` (and, behind it, a reachable Moodle instance — see [`deploy/moodle/`](../../deploy/moodle))

## Configuration

Env vars are validated via [`@t3-oss/env-core`](https://env.t3.gg) in `src/env.ts`, prefixed `VITE_`:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_CLIENT_ID` | **yes** | — | Moodle OAuth2 client id (must match `apps/sms-api`'s `CLIENT_ID`) |
| `VITE_OAUTH2_URL` | no | `http://localhost:8081` | Moodle OAuth2 base URL |
| `VITE_TOKEN_URI` | no | `local/oauth2/login.php` | Moodle OAuth2 login path |
| `VITE_REDIRECT_URI` | no | `http://localhost:4000/oauth2/callback` | Must match `apps/sms-api`'s `REDIRECT_URL` |
| `VITE_API_URL` | no | `''` (same-origin) | Base URL of `apps/sms-api` |
| `VITE_APP_TITLE` | no | — | App title |

Create `apps/sms-web/.env` (or `.env.local`) for local overrides.

## Running locally

```bash
cd apps/sms-web
pnpm dev      # http://localhost:3000 (alias: pnpm start)
```

```bash
pnpm build    # production build → dist/
pnpm serve    # preview the production build locally
pnpm test     # vitest run
```

## Architecture

- **Routing**: [TanStack Router](https://tanstack.com/router), file-based under `src/routes/`.
- **Data fetching**: [TanStack Query](https://tanstack.com/query) via `src/hooks/`.
- **Auth**: OAuth2 redirect flow against Moodle — the user is sent to Moodle's login (`VITE_OAUTH2_URL` + `VITE_TOKEN_URI`), Moodle redirects back to `apps/sms-api`'s `/oauth2/callback`, which then redirects to this app's `VITE_REDIRECT_URI` with tokens.
- **UI components**: shared primitives from `@repo/ui` (`packages/ui`); app-specific components in `src/components/`.
- **i18n**: `src/i18n/` (Vietnamese strings in `vi.json`).
- **State/business logic**: `src/biz/`, `src/const/`, `src/data/`, `src/types/`.

## Directory reference

```
apps/sms-web/
├── src/
│   ├── routes/          File-based TanStack Router routes
│   ├── api/               API client wrappers
│   ├── hooks/              TanStack Query hooks
│   ├── components/         App-specific React components
│   ├── i18n/                Localization
│   ├── biz/, const/, data/, lib/, types/, assets/, integrations/
│   └── env.ts               Typed env var validation
├── public/
├── vite.config.ts
├── components.json         shadcn config
└── Dockerfile               Multi-stage: turbo-pruned pnpm build → static nginx image
```

## Docker

```bash
docker build -t <your-tag>:sms-web -f apps/sms-web/Dockerfile \
  --build-arg VITE_CLIENT_ID=... \
  --build-arg VITE_OAUTH2_URL=... \
  --build-arg VITE_TOKEN_URI=... \
  --build-arg VITE_REDIRECT_URI=... \
  --build-arg VITE_API_URL=... \
  .
```

Build from the **repo root** — the Dockerfile runs `turbo prune sms-web --docker` against the full monorepo before installing/building. All `VITE_*` vars must be passed as `--build-arg`s (Vite bakes client env vars into the bundle at build time). CI (`.github/workflows/ci.yaml`) builds this image twice, once per network (`wan`/`lan`), against different GitHub Environments — each network reaches a different Moodle/API endpoint.
