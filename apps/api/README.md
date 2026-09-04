# QLHV API

Backend for **QLHV** (Quản lý học viên — trainee/personnel management): units, classes, students, facilities (buildings/rooms), materiel (weapons/equipment inventory), role-based authorization, and audit logging for a military training organization.

Built on [Encore.ts](https://encore.dev/docs/ts) (TypeScript), with [Drizzle ORM](https://orm.drizzle.team) over SQLite (via [libSQL](https://github.com/tursodatabase/libsql)).

## Prerequisites

- **[Encore CLI](https://encore.dev/docs/install)** — `curl -L https://encore.dev/install.sh | bash` (Linux) — required to run, build, and check this app; it is not a plain Node server.
- **Docker** — Encore spins up local infra containers (e.g. object storage emulation) even for `encore run`.
- **Node.js 20+** and **pnpm** (installed at the repo root — see the [root README](../../README.md)).

## Configuration

Config is loaded from `process.env` via `dotenv` + a [valibot](https://valibot.dev) schema (`configs/index.ts`). Create `apps/api/.env` with:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `HASH_SECRET` | **yes** | — | Argon2 pepper for password hashing (`auth/controller.ts`) |
| `JWT_PRIVATE_KEY` | **yes** | — | Symmetric secret used to sign/verify access & refresh JWTs |
| `S3_ACCESS_KEY` | **yes** | — | S3-compatible object storage (MinIO in dev/prod) credentials |
| `S3_SECRET_KEY` | **yes** | — | " |
| `PORT` | no | `8080` | HTTP port |
| `S3_ENDPOINT` | no | `http://localhost:9000` | MinIO/S3 endpoint |
| `S3_DEFAULT_BUCKET` | no | `my-first-bucket` | Bucket used for uploads (media, export templates) |
| `S3_REGION` | no | `us-west-rack-2` | |
| `DATABASE_URI` | no | `./data/local.db` | SQLite/libSQL connection string |

In production (`infra.config.json`), Pub/Sub (see below) is backed by NSQ rather than Encore's default; MinIO and NSQ connection details there come from the deployment's env, not this table.

## Running locally

```bash
cd apps/api
encore run
```

- API: `http://localhost:4000`
- Encore local dev dashboard (traces, service catalog, architecture diagram): `http://localhost:9400`
- On first run, Encore applies `migrations/*.sql` automatically against a local SQLite DB (Docker-backed).

### Useful scripts (`package.json`)

```bash
pnpm test       # vitest
pnpm generate   # drizzle-kit generate — create a new migration from schema.ts changes
pnpm migrate    # drizzle-kit migrate — apply pending migrations
pnpm push       # drizzle-kit push   — push schema directly (dev convenience, skips migration files)
pnpm gen        # encore gen client --output=../web/src/api/client.ts --env=local
```

`pnpm gen` regenerates the typed API client consumed by `apps/web` — run it after adding/changing any endpoint so the frontend's `apps/web/src/api/client.ts` stays in sync.

> Don't run `tsc` directly in this app — Encore.ts uses its own build/typecheck pipeline. Use `encore run` for dev, `encore check` to typecheck without starting the server, and `pnpm <script>` (as above) via Encore where relevant.

## Architecture

### Services

Encore.ts treats every directory containing an `encore.service.ts` as an independent service; API endpoints (`export const Foo = api(...)`) live in plain `.ts` files inside that directory and its subdirectories. Services in this app:

`actions`, `audit-logs` (service name `audit_logs`), `auth`, `classes`, `export-templates`, `facilities`, `materials`, `permissions`, `positions`, `resources`, `roles`, `students`, `transfer-requests`, `units`, `user-roles`, `users`.

A few directories provide endpoints or shared logic without being their own service — they're folded into whichever service imports them, or (like `auth`) are Encore's "implicit" folder-derived service:

- `notifications/`, `healthcheck/` — expose their own endpoints via an implicit service (no `encore.service.ts` needed if nothing else is registered there)
- `media/`, `topics/`, `export/`, `objectStorage/`, `logger/` — shared library code (S3 upload helpers, Pub/Sub topic definitions, docx/xlsx export helpers, structured logging) consumed by the services above, not endpoints themselves
- `middleware/` — cross-cutting Encore middlewares wired into services via each `encore.service.ts`'s `middlewares: [...]` array:
  - `authz.ts` — `authzMiddleware` (computes the caller's visible unit/class IDs from their org position) and `permissionMiddleware` (RBAC enforcement against a `method:path → required permission[]` map)
  - `audit.ts` — `auditMiddleware` (writes an audit-log event for mutating routes listed in its route map, sanitizing sensitive fields like `password` first)
  - `rate-limit.ts` — `rateLimitMiddleware` (generic, tag-based rate limiting — opt an endpoint in with `tags: ['rate_limit']` plus an entry in `RATE_LIMIT_RULES`; currently used on `POST /authn/login`, keyed by username, counting only failed attempts)
  - `permission-tags.ts` — `PermissionTag` constants (`perm:<resource>:<action>`) used when seeding/assigning permissions

See [`AUTHORIZATION_PATTERNS.md`](../../AUTHORIZATION_PATTERNS.md) at the repo root for the full RBAC design, and [`claude.md`](../../claude.md) for the database ERD.

### Auth

- Login (`POST /authn/login`) verifies an Argon2 hash (peppered with `HASH_SECRET`) and issues a short-lived access JWT (30m) and a longer-lived refresh JWT (7d), both signed with `JWT_PRIVATE_KEY` and scoped with an `issuer`/`audience` claim (`auth/controller.ts`).
- The Encore `Gateway`'s `authHandler` (`auth/auth.ts`) verifies the access token on every `auth: true` endpoint and rejects a token whose `type` isn't `'access'`; `POST /authn/refresh` does the mirror check for `'refresh'`.
- `authzMiddleware` + `permissionMiddleware` run after authentication to enforce RBAC and unit-scoped visibility on every request.

### Database & migrations

Schema lives in `schema/` (Drizzle table definitions); SQL migrations in `migrations/`. Workflow:

```bash
# after changing schema/*.ts
pnpm generate    # writes a new migrations/xxxx_*.sql from the schema diff
pnpm migrate     # applies it (encore run also auto-applies pending migrations on start)
```

For data-only/seed migrations (no schema change — e.g. seeding a new permission), write the `.sql` file by hand rather than via `drizzle-kit generate`. See `claude.md`'s "Generate Migrations" / "Workflow" sections for the full convention.

### Pub/Sub

Two topics (see `infra.config.json`): `notification-events` and `audit-log-events`, each with one subscription. In production these are backed by NSQ (`nsq-nsqd.amqp.svc.cluster.local:4150`); locally Encore provisions an in-process/dev equivalent automatically.

## Testing

```bash
pnpm test
```

Runs Vitest. (`encore test` also exists upstream in Encore.ts and additionally spins up test infra first — use it if a test needs a real database/Pub/Sub rather than mocks.)

## Docker

```bash
# from apps/api/
encore build docker temp-api:build --base=node:22-slim --config ./infra.config.json
docker build -t <your-tag>:api .
```

The `Dockerfile` here just layers timezone data (`Asia/Ho_Chi_Minh`) and a writable `/workspace/apps/api/data` directory on top of the image Encore's own build step produces — it is **not** a standalone Dockerfile you can `docker build .` without the `encore build docker` step first. See `Makefile`'s `api` target and [`deploy/README.md`](../../deploy/README.md) for how this fits into the full stack (env file, volumes for `templates/` and `local.db`, NSQ/MinIO dependencies).

## Directory reference

```
apps/api/
├── <service>/            One dir per Encore service (see Services above): *.ts endpoints, repo.ts, controller.ts
├── middleware/            Cross-cutting Encore middlewares (authz, audit, rate-limit)
├── schema/                 Drizzle table definitions
├── migrations/             SQL migrations (schema + seed)
├── configs/                Env var loading/validation (valibot)
├── errors/                 AppError → Encore APIError mapping
├── utils/                  Shared helpers (DB error mapping, etc.)
├── templates/               docx/xlsx export templates
├── encore.app               Encore app manifest (CORS config, etc.)
├── infra.config.json         Production infra bindings (NSQ Pub/Sub)
├── drizzle.config.ts         Drizzle Kit config (used by generate/migrate/push)
└── Dockerfile                Final image layer on top of `encore build docker`'s output
```
