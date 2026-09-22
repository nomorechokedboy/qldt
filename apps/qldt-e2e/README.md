# qldt-e2e

End-to-end tests that drive the real web app in a browser, from an empty
system to a fully used one. Each test file is one **chapter** of a single
story, and every chapter is recorded as a 1080p video with on-screen
captions, so the recordings can go straight into a report.

Nothing here touches your development data: the tests start their own
backend on its own empty database.

## Quick start

Prerequisites: Node 22+, pnpm, and the [Encore CLI](https://encore.dev/docs/install)
(the API cannot start without it — check that `encore run` works in `apps/api`).
Ports **4100** (API) and **4173** (web) must be free.

```sh
pnpm install                 # from the repo root
pnpm --filter qldt-e2e install-browsers   # once: downloads Chromium

pnpm e2e                     # run the whole story, chapter by chapter
```

The first run builds the web app (about a minute); the whole story then plays
back at full speed. Add `E2E_PACE=1` for the recording pace (see below).
Watching is optional — it runs headless.

Videos are written to `apps/qldt-e2e/videos/`, one file per chapter
(`01-first-run.webm`, `02-units.webm`, …). A failed run also leaves a
screenshot and a trace in `test-results/`; open the trace with
`pnpm --filter qldt-e2e exec playwright show-trace <trace.zip>`, and the HTML
report with `pnpm --filter qldt-e2e exec playwright show-report`.

## What runs

`playwright.config.ts` starts two servers for the duration of the run and
stops them afterwards:

| Server | Command | Address |
| --- | --- | --- |
| API | `encore run` in `apps/api`, `DATABASE_URI=.tmp/e2e.db` (deleted at the start of every run) | `localhost:4100` |
| Web | production build of `apps/web` served by `vite preview`, `VITE_API_URL=http://localhost:4100` | `localhost:4173` |

Chapters run **in file order, on one worker, and stop at the first
failure**: each one builds on the data the previous ones created. The
database starts empty, so chapter 01 is the real first-run flow (root unit →
first administrator → login) and saves the signed-in browser state that the
later chapters start from.

| Chapter | Covers |
| --- | --- |
| `01-first-run` | Root unit, first administrator, password rules, login |
| `02-units` | Building the unit tree, editing and deleting a unit, sidebar tree |
| `03-users-roles` | Custom role and its permissions, two accounts, role assignment, wrong password, what a company commander can and cannot see, blocked admin pages |
| `04-positions` | Position catalog per unit level: create, priority ordering, edit, delete, HSQ flag (the troopers chapter picks from these) |
| `05-troopers` | Adding troopers through the wizard, validation, per-unit lists, details panel, editing a phone number |
| `06-troopers-bulk` | Excel import (template download, a bad file rejected, a good one accepted), choosing table columns, editing a rank in place, deleting a trooper |
| `07-rank-promotion` | Two battalion accounts (proposer, approver) named as commanders, promotion proposals: one-rank-step eligibility, approve, reject with a reason, cancel, rank applied to the trooper |
| `08-activity-status` | Status-change proposals (annual leave, weekly leave, drill, discharge): the four proposable statuses, date range vs single date, approve, reject with a reason, cancel, status filter, status shown on the trooper's edit form |
| `09-transfer-requests` | Moving troopers between companies: approver limited to the shared superior unit's command, one request cancelled, one rejected with a reason, one approved and the trooper appearing in the new unit |

More chapters are added one at a time; this table is the source of truth for
what is covered.

## Working on one chapter

Replaying everything to reach chapter 7 is slow. Save the database after a
chapter, then start later runs from it:

```sh
pnpm --filter qldt-e2e e2e 02              # run chapter 02 (and only it) — needs chapter 01's data,
                                           # so it only works after a full run or from a snapshot
pnpm --filter qldt-e2e snapshot after-02   # after a run: keep .tmp/e2e.db under a name
E2E_SNAPSHOT=after-02 pnpm --filter qldt-e2e e2e 03   # start from that database
```

Snapshots live in `.tmp/snapshots/` and are not committed. The browser login
state (`.tmp/admin-state.json`) is written by chapter 01 and reused as is.

Environment switches:

| Variable | Effect |
| --- | --- |
| `E2E_SNAPSHOT=<name>` | Start the API from a saved database instead of an empty one |
| `E2E_SKIP_BUILD=1` | Reuse the previous web build in `.tmp/web-dist` (faster; only valid while `apps/web` is unchanged; rebuild after any web source change) |

## Writing a chapter

Copy the shape of `tests/02-units.spec.ts`:

```ts
import { ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'

test.use({ storageState: ADMIN_STATE })      // start signed in

test('what this chapter shows', async ({ page, story }) => {
	await page.goto('/some-page')
	await story.chapter('Title card', 'Subtitle')          // opens the video

	await story.step('Caption shown while this happens', async () => {
		// drive the UI and assert on what a user would see
	})
})
```

- **`story.step(caption, fn)`** puts the caption on screen, gives the viewer
  time to read it, runs `fn`, then pauses. Steps also show up by name in the
  report. Keep the caption in Vietnamese: it is what ends up in the video.
- **`t('units:form.name')`** returns the app's own Vietnamese text from
  `apps/web/src/i18n/locales/vi`, so labels are never copied into the tests.
  If the app rewords a label, the tests follow; if a key is removed, `t`
  throws with its name.
- The recording is named after the file (`03-users-roles.spec.ts` →
  `videos/03-users-roles.webm`). Number the files in the order they should run.
- Playwright's own video does not show the mouse, so `support/overlay.ts`
  injects a cursor, a click ripple and the caption bar into every page.
- Prefer roles and labels (`getByRole`, `getByLabel`) over CSS; the app has a
  few hover-only controls (e.g. the unit card actions) — `hover()` the card
  first, which also reads well on video.
- Chapters run at full speed while they are being written. With `E2E_PACE=1`
  (the recording run) every input field — typed text, a select, a checkbox — is
  followed by a 3 s rest (`AFTER_INPUT_MS` in `support/pace.ts`), captions stay
  up long enough to read and slowMo is on. After picking from a custom list call
  `rest(page)`; it does nothing unless pacing is on.
- Every action times out after 20 s; a chapter fails fast instead of hanging.
