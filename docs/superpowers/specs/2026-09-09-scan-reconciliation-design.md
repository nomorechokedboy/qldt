# Scan-Reconciliation (QR Inventory Challenge) — Design

## Context

The API/web app runs on a fully closed military WAN (cable-only PCs, no
internet egress). It is installed and updated via USB. Phones can reach the
public internet but **cannot join the WAN** — they can never talk to `apps/api`
directly. This design exists to let a phone participate in physical
inventory reconciliation anyway, by moving all data across the air gap as QR
codes rather than over a network.

Weapons currently have no scannable tag — only an engraved serial (7
alphanumeric characters, e.g. `A808834`, `KZ08029`, `A081420`). A future,
separate feature will add printable QR tags per material (`materialAssets`
already has a unique `serialNumber`); this design does not depend on that
feature and is not blocked by it.

## Goal

A commander can open an inventory-reconciliation session for a room (e.g. a
platoon armory), hand a phone to the trooper doing the physical count, and
get a discrepancy report (missing / extra / condition-mismatched weapons)
back into the system — without the phone ever touching the WAN.

## Non-goals (this iteration)

- Physical QR/barcode tags on weapons (future feature, compatible but separate).
- Non-weapon material types (furniture/equipment/vehicle) — the schema
  supports it, but the 40-gun platoon-armory case is the driving scenario;
  extending to other categories is a follow-up once this ships.
- Any network call from the phone app to `apps/api`.

## Why the QR-only design works: payload size

Per-asset fields needed in both directions: material type, 7-char serial,
condition (`good` | `fair` | `needs_maintenance` | `damaged` — 4 values, 2
bits, from the existing `MaterialConditionName` enum in
`apps/api/schema/material-stocks.ts`).

- Compact encoding: 1 byte type index + 7 bytes serial + 1 byte condition ≈
  9 bytes/asset.
- 40 guns × 9 bytes = 360 bytes, plus a small header (session id, room id,
  item count, format version) and an 8-byte integrity checksum ≈ **~400
  bytes**.
- A single QR code (byte-mode, medium error correction) comfortably holds
  1,700–2,900 bytes.

**Conclusion: a single static QR code, not an animated/multi-frame
sequence, is sufficient in both directions**, with headroom for a
building-level session (a few hundred assets) before this would need to
change. This removes an entire category of complexity (frame reassembly,
partial-scan recovery, frame-ordering UI) from the first version.

Serial characters (`A808834`, `KZ08029`, ...) are uppercase letters and
digits only, which fits QR's alphanumeric encoding mode — slightly denser
than byte mode, not required at this scale but free headroom if item counts
grow later.

## Architecture

```
┌─────────────┐   QR (challenge)   ┌──────────────┐   QR (results)   ┌─────────────┐
│  apps/web    │ ─────────────────▶ │  Tauri phone  │ ────────────────▶ │  apps/web    │
│ (PC, on WAN) │                    │  app (offline)│                   │ webcam scan  │
└──────┬───────┘                    └──────────────┘                   └──────┬───────┘
       │                                                                        │
       ▼                                                                        ▼
  apps/api (WAN-local, SQLite)  ◀──────────────────────────────────────────────┘
  inventory_sessions / inventorySessionExpectedAssets / inventorySessionScans
```

### Phone app: Tauri

Chosen for cross-platform reach ("multiversal" — one codebase, Android/iOS
today, desktop later if useful) from the existing web/React skillset already
used in `apps/web`. Tauri's Rust core needs no network permissions for this
feature; the app ships with **all network capabilities disabled** — it is
architecturally incapable of calling home even by accident, which is a
useful property to state plainly in any adoption pitch. Local state
(current session, expected list, scan results) lives in an embedded SQLite
file (via `tauri-plugin-sql`) or plain on-disk JSON — SQLite recommended so
a half-finished session survives an app restart.

### PC side (existing `apps/web`)

- QR **generation** (challenge, and later decoding results is via webcam,
  not generation) — `qrcode` (npm) rendering to a `<canvas>`/`<img>`, no new
  backend dependency.
- QR **decoding** from the results QR — `@zxing/browser` (or `jsQR`) reading
  frames from `getUserMedia`. Both are pure client-side, no data leaves the
  browser other than the final decoded payload POSTed to `apps/api`.

## Data flow

1. **Open session (PC):** commander picks a room, `apps/api` creates an
   `inventory_sessions` row (`status: in_progress`, `roomId`, `unitId`,
   `startedByUserId`) and a matching `inventorySessionExpectedAssets` set
   pulled from the current `materialAssets` for that room (type, serial,
   condition — the last known values from the DB, i.e. what's *expected*
   to be there).
2. **Challenge QR:** `apps/api` returns a compact encoded payload; `apps/web`
   renders it as a QR code on screen. Payload:
   ```
   {
     v: 1,                     // format version
     sid: "<session id>",
     roomId: <int>,
     expected: [ { type: "AK", serial: "A808834", condition: "good" }, ... ],
     sig: "<8-byte HMAC truncation, keyed by a per-session secret also stored server-side>"
   }
   ```
   The signature lets the PC verify, on results import, that the results QR
   actually corresponds to the challenge it issued (see Integrity below).
3. **Scan (phone, fully offline):** trooper scans the challenge QR once.
   The app loads `expected` into local state and walks the list one item at
   a time: for each weapon, the trooper enters/selects the serial (typed,
   since there's no physical tag yet) and the observed condition. The app
   diffs live against `expected` and shows a running status — matched,
   condition-changed, or (at the end) anything in `expected` never marked
   found. The trooper can also add a serial not in `expected` (flagged
   `extra`).
4. **Confirm & export (phone → PC):** on confirm, the app builds:
   ```
   {
     v: 1,
     sid: "<same session id>",
     results: [
       { serial: "A808834", status: "matched" | "missing" | "extra" | "condition_changed",
         observedCondition: "good" | "fair" | "needs_maintenance" | "damaged" }, ...
     ],
     sig: "<HMAC over results, same session secret>"
   }
   ```
   rendered as a QR on the phone screen.
5. **Import (PC webcam):** `apps/web` decodes the results QR, verifies `sid`
   matches the open session and `sig` verifies against the session secret
   held server-side, then POSTs the decoded payload to `apps/api`, which
   writes one `inventorySessionScans` row per item and flips the session to
   `status: completed`. A reviewer can later mark it `reviewed`.

## Integrity: why the signature matters

The phone never authenticates to `apps/api` — it only ever sees a QR code.
Without some check, anyone with a phone could show the PC's webcam a
hand-crafted "results" QR for a session they never actually ran. The
session secret (random bytes generated server-side when the session opens,
embedded only in the challenge QR, never transmitted any other way) plus an
HMAC over the results payload gives a cheap, fully-offline way to reject
forged or stale results without any phone-side network access. This is
enough for the reconciliation use case (catching honest mismatches and
gross tampering); it is not a replacement for the existing user-auth model
guarding the rest of the app.

## Error handling

- **Malformed/corrupted QR read** (partial camera frame, smudged code):
  standard QR error-correction handles minor damage; a decode failure just
  re-prompts "couldn't read that code, try again" — no partial-state risk
  since the payload is atomic (single QR, not multi-frame).
- **Signature mismatch on import:** reject with a clear "this result doesn't
  match an open session" error; do not write any `inventorySessionScans`
  rows.
- **Session already completed/reviewed:** importing again is rejected —
  session status is the guard, not a client-side check.
- **Phone app killed mid-session:** local SQLite persists the loaded
  `expected` list and any entries the trooper already recorded, so the app
  resumes where it left off rather than forcing a re-scan of the challenge
  QR.
- **Room's asset list changed between challenge and import** (e.g. someone
  edited a `materialAssets` row from the PC while the phone was mid-scan):
  out of scope for this iteration — the challenge snapshot is authoritative
  for that session; a note in the review UI can flag if `materialAssets` was
  touched during the session window (comparing `updatedAt`), but that's a
  smaller follow-up, not a blocker.

## New/changed surface area

- **`apps/api`**: new endpoints — create session (+ challenge payload),
  submit results (+ signature verification), get session/scan history for
  review. Reuses existing `inventory_sessions`, `inventorySessionExpectedAssets`,
  `inventorySessionScans` schema (already present, currently unwired).
- **`apps/web`**: new session-open UI (room picker → QR display), new
  webcam-import UI (camera view → decoded diff preview → confirm import),
  both as a new route, not folded into `StudentTable`/material tables.
- **New Tauri app** (new package in the monorepo, e.g. `apps/scan-app`):
  challenge-scan screen, per-item entry screen, live diff view, results-QR
  screen. No calls to `apps/api` at all — its only I/O is the camera and
  local SQLite.

## Testing plan

- **Payload encode/decode**: unit tests for the compact binary/JSON encoding
  and HMAC sign/verify, both directions, including the 40-item worst case
  and a boundary case near QR capacity.
- **`apps/api`**: session creation snapshots `materialAssets` correctly;
  results import is idempotent-safe (rejects replay/duplicate import);
  signature verification rejects tampered payloads.
- **Tauri app**: offline-only — a test harness that asserts no network
  capability is present/reachable; local diff logic (matched/missing/extra/
  condition_changed) against fixed fixture data.
- **Manual end-to-end**: real QR round-trip, PC screen → phone camera →
  phone screen → PC webcam, under normal room lighting, to catch anything
  the unit tests can't (glare, screen brightness, camera focus distance).

## Decisions (resolved during review)

- **Tauri app**: the user is building this piece directly; this design and
  its implementation only need to define the wire format (challenge/results
  payload shape + signature) it must produce and consume. Not part of the
  `apps/api`/`apps/web` prototype scope.
- **Extras never block completion**: a scanned serial with no matching
  `materialAssets` row is recorded (`assetId: null`) and surfaced in the
  diff, but does not prevent the session from completing.
- **Scope for this iteration: `material_assets` only** (serialized items —
  weapons). `material_stocks` (bulk, non-serialized quantities) is out of
  scope until this ships.

## Prototype status

A backend-only prototype exists proving the risky part of this design (the
signed challenge/results round trip and the diff logic) end to end at the
data layer, in `apps/api/inventory-sessions/`:

- `payload.ts` — challenge/results payload shape, per-session HMAC signing
  (derived from `appConfig.HASH_SECRET` + session id, never a stored
  per-session secret) and verification.
- `diff.ts` — pure `computeInventorySessionDiff` (matched / missing / extra
  / condition_changed), covered by `payload.test.ts`.
- `inventory-sessions-repo.ts` / `inventory-sessions-controller.ts` /
  `inventory-sessions.ts` — wires the above into
  `CreateInventorySession`, `SubmitInventorySessionResults`, and
  `GetInventorySessionReview` endpoints, reusing the existing
  `inventory_sessions` / `inventorySessionExpectedAssets` /
  `inventorySessionScans` schema.
- `payload.test.ts` passes (`pnpm vitest run inventory-sessions`), and the
  full app passes `encore check` with the new service included.

**Root-cause note for future work in this schema area:** exposing a
Drizzle `InferSelectModel`-derived type (e.g. `InventorySessionDB`)
directly as an API response breaks Encore's static analyzer ("unsupported
member on type never" pointing at the `sqlite.sqliteTable(...)` call). The
existing codebase already avoids this everywhere (`materials/material-assets.ts`
hand-rolls its own `MaterialAssetDB`; `transfer-requests.ts` has an
explicit `toResponse()` mapper) — `inventory-sessions-controller.ts` now
follows the same pattern via `toSessionResp()`. Any new endpoint in this
area should return a hand-written response type, never a raw
`InferSelectModel` type.

**Update:** the `apps/web` UI and `apps/scan-app` (Tauri phone app) are now
both built. See the "Phone app" entry under the Inventory Session section of
the repo-root `claude.md` for the phone app's file structure and the one
signing gotcha (Node's `createHmac` treats a string key as raw UTF-8 bytes,
not hex-decoded bytes) caught via a cross-runtime test before it ever
reached a real device. The `key` field was added to
`InventorySessionChallengePayload` after the initial prototype - it wasn't
in the original design draft below, but is required for the phone to sign
results without ever holding `HASH_SECRET` (see Integrity section). Not yet
verified on a real device: whether `getUserMedia` resolves in Tauri's
Android WebView with just the manifest camera permission, or whether it
needs the native `@tauri-apps/plugin-barcode-scanner` plugin instead.

## Open questions for review

1. Confirm the 8-byte HMAC truncation is enough, or whether a longer
   signature is worth the small QR-capacity cost given how much headroom
   exists.
