# api-go

Proof-of-concept encore.go rewrite of `apps/api` (encore.ts). Started with the
`students` table only, covering bare CRUD (create/list/get/update/delete)
behind JWT auth, so it can be validated in isolation before other services
are ported over. Once this pattern is proven out, the plan is to migrate the
remaining services (classes, units, users, auth, ...) from `apps/api` into
this app one at a time, and retire the TypeScript app when the last service
moves over.

## Why a separate app

Encore does not support mixing TypeScript and Go services in a single app,
so this has to live side by side with `apps/api` until the migration is
complete rather than being ported in place.

## Stack

- **Framework**: encore.go
- **DB**: SQLite (matches `apps/api`), via `github.com/mattn/go-sqlite3` +
  `github.com/pocketbase/dbx` as the query layer.
- **Migrations**: `golang-migrate`, embedded via `go:embed` and applied on
  startup (see `internal/db`), following the same pattern as
  `apps/sms-api/audit`.
- **Auth**: verifies the same HS256 JWTs issued by `apps/api`'s `auth`
  service (shared `JWT_PRIVATE_KEY`, same issuer/audience), so a token
  minted by the TS app works here unchanged.

## Config

Environment variables (see `config/config.go`):

- `JWT_PRIVATE_KEY` — must match `apps/api`'s `JWT_PRIVATE_KEY` to accept its
  tokens.
- `DATABASE_URI` — path to the SQLite file. Point it at `apps/api`'s
  `local.db` to work against the same data, or leave it at the default to
  use a standalone database for local development.

## What's intentionally out of scope for this first pass

- The `authz`/`audit` middleware (permission-map + audit log side effects).
- classId/unitId ownership validation, docx/xlsx export, cron jobs,
  notifications, MinIO avatar injection, politics-quality report.

These will be added once bare CRUD is confirmed to work end-to-end.
