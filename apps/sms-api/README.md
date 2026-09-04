# SMS API

Backend for **SMS** (Student Management System) — a management layer on top of an existing **Moodle** LMS. It authenticates against Moodle via OAuth2, reads Moodle's own MySQL database directly for some queries, and calls Moodle's REST API for others, presenting a purpose-built API to [`apps/sms-web`](../sms-web/README.md).

Built on [Encore.ts for Go](https://encore.dev/docs/go) — in Go Encore, each top-level package directory is an implicit service (no `encore.service.ts` equivalent needed).

## Prerequisites

- **[Encore CLI](https://encore.dev/docs/install)**
- **Go 1.24+**
- A reachable **Moodle 5.0** MySQL database and Moodle REST API (see [`deploy/moodle/`](../../deploy/moodle) for the image this talks to)
- **Redis** (session/lang-pack cache)

## Configuration

Config is loaded via [cleanenv](https://github.com/ilyakaznacheev/cleanenv) from environment variables (and, in dev, also from a `.env` file — see `internal/config/app.go`). Create `apps/sms-api/.env`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENV` | `dev` | `dev` also loads `.env` via cleanenv; anything else reads env-only |
| `PORT` | `4000` | HTTP port |
| `LOG_LEVEL` | `DEBUG` | slog level |
| `CLIENT_ORIGIN_URL` | `http://localhost:3000` | Frontend origin, used to build the OAuth2 callback redirect |
| `CLIENT_OAUTH2_CALLBACK` | `oauth2/callback` | Frontend route the callback redirects to |
| **Database (Moodle's own DB)** | | |
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `3307` | |
| `DB_NAME` | `moodle` | |
| `DB_USER` | `bn_moodle` | |
| `DB_PWD` | *(empty)* | |
| **Redis cache** | | |
| `REDIS_URI` | `localhost:6379` | |
| `REDIS_PWD` | *(empty)* | |
| `REDIS_DB` | `0` | |
| **OAuth2 (against Moodle)** | | |
| `CLIENT_ID` | — | Moodle OAuth2 client id |
| `CLIENT_SECRET` | — | |
| `ORIGIN_URL` | — | Moodle base URL |
| `AUTH_URL` | — | Moodle OAuth2 authorize path |
| `TOKEN_URL` | — | Moodle OAuth2 token path |
| `REDIRECT_URL` | `http://localhost:4000/oauth2/callback` | Must match what's registered in Moodle |
| **App JWTs (issued by this service, not Moodle's)** | | |
| `JWT_SECRET` | `token-secret` | |
| `JWT_REFRESH_SECRET` | `refresh-secret` | |
| `TOKEN_EXPIRE` | `30` (minutes) | |
| `REFRESH_TOKEN_EXPIRE` | `84` (minutes) | |
| **Moodle REST API** | | |
| `MOODLE_URL` | `http://localhost:8083` | |
| `MOODLE_API_TOKEN` | — | |
| **OpenTelemetry** | | |
| `OTEL_ENDPOINT` | `localhost:4318` | |
| `OTEL_VERSION` / `OTEL_URL` | | Schema version/URL sent with traces/logs |
| **Audit log retention** | | |
| `AUDIT_PURGE_TIME` | `02:00` | Daily UTC purge time |
| `AUDIT_RETENTION_DAYS` | `90` | |

Change the defaults for anything security-sensitive (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DB_PWD`) before running outside of local dev.

## Running locally

```bash
cd apps/sms-api
encore run
```

- API: `http://localhost:4000`
- Encore local dev dashboard: `http://localhost:9400`

## Architecture

### Services (one per top-level package)

| Service | Routes | Purpose |
| --- | --- | --- |
| `authn` | `GET /oauth2/callback` (public), `GET /authn/me`, `POST /authn/refresh` (public) | Moodle OAuth2 login flow; issues this app's own access/refresh JWTs after exchanging the Moodle code |
| `usrcategories` | `GET /categories` | Course categories, filtered by the caller's role |
| `usrcourses` | `GET /courses`, `GET /courses/:id`, `PUT /courses`, `GET /categories/:categoryId/courses` | Course listing/detail, proxied from Moodle |
| `usrgrades` | `GET /users/grades` | Grade lookups per user |
| `usrexport` | `GET /courses/:id/export`, `GET /courses/:id/export/templates`, `GET /admin/export/templates`, `POST /admin/export/templates`, `DELETE /admin/export/templates/:templateType/:templateId` | Grade export (xlsx/docx) and export-template management |
| `auditlog` | `GET /audit/logs`, `GET /audit/stats`, `DELETE /audit/logs` | Query and purge audit log events |
| `appconfig` | `GET /config/langpack` (public), `PUT /config/langpack`, `DELETE /config/langpack` | Admin-managed i18n language pack, cached in Redis |
| `otlp` | `GET /otel/health` (public) | OpenTelemetry bridge health |
| `healthz` | `GET /healthz` (public) | Liveness/readiness probe |

### Shared packages (not services)

- `internal/config/` — the `Config` struct above, one file per concern (`db.go`, `cache.go`, `oauth2.go`, `authn.go`, `mdlapi.go`, `otel.go`, `audit.go`), loaded once via `cleanenv` and exposed as a singleton via `config.GetConfig()`.
- `internal/entities/` — shared domain types (`TokenPayload`, `UserInfo`, roles, etc.).
- `internal/usecases/`, `internal/oauth2/` — OAuth2 flow logic (Moodle provider implementation + use case orchestration).
- `internal/mdlapi/` — Moodle REST API client.
- `internal/db/` — the raw MySQL connection to Moodle's own database.
- `internal/cache/` — Redis client setup.
- `internal/logger/` — structured `slog`-based logging with three handler variants: plain rlog (Encore's built-in), OTEL-bridged, and a composite of both (`NewSlogLoggerWithRlogAndOtel`) — auto-attaches Encore trace/span IDs to every log line.
- `internal/otel/` — OpenTelemetry SDK setup (traces + logs).
- `internal/healthcheck/` — backs the `healthz` service.
- `audit/` — audit-log domain types (`EventType` enum, event shape) shared between whatever emits audit events and the `auditlog` service that stores/serves them.
- `middleware/` — a global Encore middleware (`//encore:middleware global target=all`) that maintains an explicit allowlist (`auditWhitelist`) of `Service.Endpoint` pairs to audit — read-only queries are intentionally excluded, only state-changing/security-relevant actions are logged.
- `otlp/` (the package, distinct from the `otlp` service above) and `otel/` — tracing bridge between Encore's own trace context and OpenTelemetry spans, so Jaeger/etc. can correlate logs and traces.

### Auth

- Users log in through Moodle's OAuth2 flow (`GET /oauth2/callback`, driven by `internal/oauth2.MoodleOauth2Provider`), not a local username/password.
- After exchange, this service issues its **own** JWT (`TokenPayload{UserID, Role}`) — `AuthHandler` in `authn/authn.go` verifies that token on every `//encore:api auth` endpoint via Encore's `//encore:authhandler` mechanism.
- Role (`admin` > `manager` > `teacher` > `student`) is embedded directly in the JWT so downstream handlers don't need an extra DB/cache lookup to authorize.

## Testing

```bash
go test ./...
```

## Docker

```bash
cd apps/sms-api
encore build docker <your-tag>:sms-api
```

Unlike `apps/api`, this service has no extra `Dockerfile` layered on top — `encore build docker` produces the final image directly (see the `Makefile`'s `sms-api` target).

## Directory reference

```
apps/sms-api/
├── authn/, usrcategories/, usrcourses/, usrgrades/, usrexport/, auditlog/, appconfig/, otlp/, healthz/   Services (see table above)
├── audit/                 Audit-log domain types (shared)
├── middleware/             Global audit middleware + allowlist
├── internal/
│   ├── config/               Env var schema (cleanenv), one file per concern
│   ├── entities/              Shared domain types
│   ├── usecases/, oauth2/      Moodle OAuth2 login flow
│   ├── mdlapi/                 Moodle REST API client
│   ├── db/                     Moodle MySQL connection
│   ├── cache/                  Redis client
│   ├── logger/, otel/          Structured logging + OpenTelemetry
│   └── healthcheck/            Backs healthz
├── go.mod / go.sum
└── encore.app                 Encore app manifest
```
