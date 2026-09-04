# QLDT Monorepo

A [Turborepo](https://turborepo.com) that hosts **two independent products** built by the same team, plus the shared tooling and deployment config that ties them together.

| Product | What it is | Backend | Frontend |
| --- | --- | --- | --- |
| **QLHV** (Quản lý học viên — Trainee/Personnel Management) | Standalone system for managing military units, personnel, classes, facilities, and materiel (weapons/equipment inventory) | `apps/api` (TypeScript, Encore.ts) | `apps/web` (React, Vite, TanStack Router) |
| **SMS** (Student Management System) | A management layer bolted onto an existing **Moodle** LMS — logs in via Moodle OAuth2, proxies grades/courses/categories from Moodle, and ships a few custom Moodle plugins | `apps/sms-api` (Go, Encore.ts) | `apps/sms-web` (React, Vite, TanStack Router) |

The two products do not share a database or a backend process. They share this repo, the frontend component library (`packages/ui`), lint/TS config, CI pipeline, and (optionally) the same Docker Compose / Kubernetes cluster in `deploy/`.

## Repo layout

```
.
├── apps/
│   ├── api/          QLHV backend — Encore.ts (TypeScript), SQLite (libSQL) via Drizzle
│   ├── web/           QLHV frontend — React + Vite + TanStack Router/Query
│   ├── sms-api/       SMS backend — Encore.ts (Go), reads Moodle's MySQL DB + Moodle REST API
│   └── sms-web/       SMS frontend — React + Vite + TanStack Router/Query
├── packages/
│   ├── ui/                  Shared shadcn/Radix-based component library (@repo/ui)
│   ├── eslint-config/       Shared ESLint config (@repo/eslint-config)
│   ├── typescript-config/   Shared tsconfig bases (@repo/typescript-config)
│   ├── coursegrades/        Moodle plugin: local_coursegrades
│   ├── teachercourses/      Moodle plugin: local_teachercourses
│   ├── userinfo/            Moodle plugin: local_oauth2userinfo
│   └── customgradeexport/   Moodle plugin: local_customgradeexport (grade export to xlsx/docx)
├── deploy/
│   ├── docker-compose.yml   Compose stack for QLHV + SMS + shared infra (NSQ, MinIO)
│   ├── charts/               Helm charts (qlhv, sms)
│   ├── qlhv/, sms/           Raw k8s manifests + values files per product
│   ├── cron/                 Standalone cron-runner image + scripts (birthday/CPV notifications)
│   ├── moodle/                Dockerfile for the Moodle image SMS talks to
│   ├── minio/, harbor/, nginx/  Supporting infra manifests/config
│   └── qlhv/DEPLOYMENT.md    Step-by-step K3s/Helm deployment guide (QLHV)
├── .github/workflows/ci.yaml  Build + push Docker images to GHCR on push to main
├── Makefile                   Local `docker build` shortcuts for each image
├── turbo.json, pnpm-workspace.yaml, package.json   Turborepo/pnpm workspace config
├── claude.md                  QLHV database ERD & schema reference
└── AUTHORIZATION_PATTERNS.md  QLHV RBAC/authorization design notes
```

Each app and Moodle plugin has its own README with details specific to it — this file only covers what's shared.

## Prerequisites

- **Node.js 20+** and **pnpm** (`packageManager` pinned to `pnpm@10.14.0` — use `corepack enable` to get the right version automatically)
- **[Encore CLI](https://encore.dev/docs/install)** — both backends run on Encore.ts (`curl -L https://encore.dev/install.sh | bash` on Linux/macOS)
- **Docker** — Encore uses it to run local infra (Postgres/NSQ containers) even in dev, and it's required for image builds
- **Go 1.24+** — only needed if you're working on `apps/sms-api`
- **PHP 8.1+** and a Moodle 5.0 install — only needed if you're working on the `packages/*` Moodle plugins

## Getting started

Install JS/TS dependencies once at the repo root (pnpm workspaces cover all `apps/*` and `packages/*`):

```bash
pnpm install
```

### Run QLHV (api + web) locally

```bash
# terminal 1 — backend, http://localhost:4000, dev dashboard at :9400
cd apps/api && vim .env   # create it — required vars are listed in apps/api/README.md
encore run

# terminal 2 — frontend, http://localhost:3000
cd apps/web && pnpm dev
```

### Run SMS (sms-api + sms-web) locally

Requires a running Moodle instance to talk to (see `deploy/moodle/`), plus MySQL and Redis reachable from `apps/sms-api`.

```bash
# terminal 1 — backend, http://localhost:4000
cd apps/sms-api && vim .env   # create it — required DB/OAuth2/Moodle vars are listed in apps/sms-api/README.md
encore run

# terminal 2 — frontend, http://localhost:3000
cd apps/sms-web && pnpm dev
```

> Both backends default to port 4000 and both frontends default to port 3000 — run only one product's pair at a time, or override the port (`vite --port <n>`, and Encore's `--port` flag / `encore.app` config) if you need both up simultaneously.

### Everything via Turborepo

From the repo root, `turbo` fans these out per the `turbo.json` pipeline (`build`, `lint`, `dev`):

```bash
pnpm dev      # turbo run dev   — runs every app's dev script in parallel
pnpm build    # turbo run build — builds every app/package that defines a build script
pnpm lint     # turbo run lint
pnpm format   # prettier --write across the repo
```

`encore run` isn't wired into `turbo dev` (Encore manages its own process/dashboard), so start the backends manually as shown above.

## Docker

Each app builds to its own image. The `Makefile` at the repo root has shortcuts that mirror what CI does:

```bash
make api       # apps/api  → encore build docker, then wrap it (apps/api/Dockerfile)
make web       # apps/web  → apps/web/Dockerfile (turbo-pruned pnpm build → nginx)
make cron      # deploy/cron → cron-runner image with the notification scripts
make sms-api   # apps/sms-api → encore build docker (Go)
make sms-web   # apps/sms-web → apps/sms-web/Dockerfile (turbo-pruned pnpm build → nginx)
make sms       # sms-api + sms-web
make all       # api + web + cron + sms
```

`apps/api` and `apps/sms-api` build in two steps because Encore.ts generates its own base image first (`encore build docker ... --config infra.config.json`), which the app's `Dockerfile` then layers on top of (timezone data, a writable `/workspace/apps/api/data` dir, etc.).

`apps/web` and `apps/sms-web` build with `turbo prune <app> --docker` inside the Dockerfile — this trims the workspace down to just that app's dependency subset before installing, so the image doesn't carry the whole monorepo's `node_modules`. Both take Vite env vars as `ARG`s at build time (`VITE_API_URL`, and for `sms-web` also `VITE_CLIENT_ID`/`VITE_OAUTH2_URL`/`VITE_TOKEN_URI`/`VITE_REDIRECT_URI`) since Vite bakes them into the static bundle — see [`apps/web/README.md`](apps/web/README.md) / [`apps/sms-web/README.md`](apps/sms-web/README.md).

### docker-compose (full local/staging stack)

`deploy/docker-compose.yml` runs both products plus shared infra — NSQ (pub/sub for QLHV notifications/audit log), MinIO (S3-compatible object storage for QLHV file uploads), and a cron-scheduler container for QLHV's scheduled notification jobs:

```bash
cd deploy
docker compose up -d
```

It expects `.env.prod` (QLHV api) and `.env.sms.prod` (SMS api) next to the compose file, and pulls prebuilt images from `ghcr.io/nomorechokedboy/*` rather than building locally — build and push with the `Makefile`/CI first, or point the `image:` fields at your local tags for testing.

See [`deploy/README.md`](deploy/README.md) for the full breakdown of every service in the stack.

## Kubernetes

Both products ship as Helm charts under `deploy/charts/` (`qlhv`, `sms`), plus raw manifests for CronJobs, ConfigMaps, and PVCs under `deploy/qlhv/` and `deploy/sms/`. Start with [`deploy/qlhv/DEPLOYMENT.md`](deploy/qlhv/DEPLOYMENT.md) for a full walkthrough (NSQ/MinIO Helm deps, secrets, ingress, cron schedules, upgrade/rollback, troubleshooting) — [`deploy/README.md`](deploy/README.md) summarizes how the two products' deployments relate to each other and to the shared infra (Harbor registry, MinIO storage class).

## CI/CD

`.github/workflows/ci.yaml` runs on push to `main`. It uses `dorny/paths-filter` to detect which of `api` / `web` / `sms-api` / `sms-web` changed, then builds and pushes only the affected image(s) to `ghcr.io/<owner>/<image>:latest` and `:<branch>-<sha>`. `sms-web` builds twice (`wan`/`lan` matrix) against different GitHub Environments, since it needs different `VITE_*` build args per network.

## Conventions

- **Commits**: Conventional Commits, enforced by commitlint (`.commitlintrc.json`) via a Husky hook.
- **Formatting/linting**: Prettier + ESLint at the root (`pnpm format` / `pnpm lint`); `apps/web` and `apps/sms-web` additionally use Biome for their own lint/format (`pnpm --filter web check`).
- **TypeScript config**: both frontends and `apps/api` extend the shared bases in `packages/typescript-config`.

## Further reading

- [`apps/api/README.md`](apps/api/README.md) — QLHV backend: services, env vars, migrations, auth/RBAC
- [`apps/web/README.md`](apps/web/README.md) — QLHV frontend
- [`apps/sms-api/README.md`](apps/sms-api/README.md) — SMS backend: services, env vars, Moodle integration
- [`apps/sms-web/README.md`](apps/sms-web/README.md) — SMS frontend
- [`deploy/README.md`](deploy/README.md) — Docker Compose, Kubernetes/Helm, and supporting infra
- [`claude.md`](claude.md) — QLHV database ERD and schema reference
- [`AUTHORIZATION_PATTERNS.md`](AUTHORIZATION_PATTERNS.md) — QLHV RBAC/authorization design notes
