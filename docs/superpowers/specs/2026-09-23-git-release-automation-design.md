# Git release automation for the qldt app family

## Goal

Give `api`, `web`, and `scan-app` real, independent semantic versions,
auto-generated changelogs, git tags, and GitHub Releases - driven by a
"Version Packages" PR (the Changesets model), with zero manual version
bookkeeping and no new GitHub secrets.

`cron`, `sms-api`, and `sms-web` are explicitly out of scope for this
pass (see "Scope" below).

## Scope

**In scope:** `apps/api`, `apps/web`, `apps/scan-app`. Each already has
(or gains) a `package.json` with a real semver `version` field, and each
already has its own build pipeline (`ci.yaml`'s `build-api`/`build-web`
jobs; `scan-app-mobile.yaml`).

**Explicitly out of scope:**
- `deploy/cron` has no package identity of its own (just shell scripts
  in a Dockerfile) - it keeps its current `latest`/branch-sha Docker
  tagging, untouched.
- `sms-api` (Go, no `package.json`) and `sms-web` are a separate
  product with their own deploy path. Changesets is
  `package.json`-based; folding in a Go app needs its own workaround
  and is a deliberate follow-up, not bundled into this change.
- No npm publishing anywhere. Changesets is used purely as a
  version-bump + changelog engine; nothing in this repo is an npm
  package meant for a registry.

## Everyday flow

1. In a PR that changes `api`, `web`, and/or `scan-app`, run
   `pnpm changeset` once. It's an interactive prompt: pick which
   package(s) changed, pick a bump type (patch/minor/major) per
   package, write a one-line summary. This writes one
   `.changeset/<random-name>.md` file, which gets committed with the
   PR.
2. Merge the PR to `main` as normal.
3. A bot workflow keeps a standing **"Version Packages"** PR up to
   date on every push to `main`, whenever there's at least one pending
   changeset file. It batches however many changesets have piled up,
   bumping each affected package's `package.json` version and
   appending to its `CHANGELOG.md`.
4. Merging the Version Packages PR *is* the release. That merge is
   what triggers tagging, GitHub Release creation, and the versioned
   build - automatically, no separate manual step.

Nothing changes about how `ci.yaml` or `scan-app-mobile.yaml` are
invoked manually (`workflow_dispatch` still works exactly as it does
today) - the release flow only adds a second, automated way to invoke
them, with a version attached.

## Components

### 1. `.changeset/config.json` (new)

Standard Changesets config for a monorepo that never publishes to npm:

```json
{
	"$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
	"changelog": [
		"@changesets/changelog-github",
		{ "repo": "nomorechokedboy/qldt" }
	],
	"commit": false,
	"fixed": [],
	"linked": [],
	"access": "restricted",
	"baseBranch": "main",
	"updateInternalDependencies": "patch",
	"ignore": [
		"qldt-e2e",
		"sms-web",
		"@repo/eslint-config",
		"@repo/typescript-config",
		"@repo/ui"
	]
}
```

`ignore` keeps every other workspace member out of the `pnpm changeset`
picker entirely - they're never offered as something to bump, and
never get a `CHANGELOG.md`. `sms-api` has no `package.json` at all (see
"Scope"), so it's simply invisible to Changesets already and doesn't
need listing. `packages/customgradeexport`, `packages/coursegrades`,
`packages/teachercourses`, and `packages/userinfo` have no
`package.json` either (not part of the pnpm workspace as JS packages),
so they're likewise already invisible. `@changesets/changelog-github`
renders each changelog entry as a link to the PR/commit that
introduced it (needs no extra token - the workflow's own
`GITHUB_TOKEN` covers it).

### 2. Root `package.json` (modified)

Add dev dependencies `@changesets/cli` and `@changesets/changelog-github`,
and a script:

```json
"scripts": {
	"changeset": "changeset"
}
```

### 3. `apps/web/package.json` (modified)

Currently has no `version` field at all. Changesets needs a starting
semver to bump from - add `"version": "0.1.0"`.

### 4. `.github/workflows/release.yaml` (new)

Triggered on every push to `main`. Two independent jobs - on any given
push, in practice only one of them ever does real work (see "Why no
race" below):

**Job `version`:** checkout, setup pnpm/node, `pnpm install`, then
`changesets/action@v1` with `version: pnpm changeset version` and no
`publish` command (nothing gets published to a registry). This is the
job that opens/updates the Version Packages PR whenever pending
changeset files exist.

**Job `tag-and-release`:** checkout with full git history
(`fetch-depth: 0`, needed to read existing tags), then run a new
script, `scripts/release/tag-and-release.mjs`. For each of
`{ pkg: 'api', dir: 'apps/api' }`, `{ pkg: 'web', dir: 'apps/web' }`,
`{ pkg: 'scan-app', dir: 'apps/scan-app' }`:

1. Read `version` from `<dir>/package.json`.
2. Find the latest existing tag matching `<pkg>@*`
   (`git tag -l "<pkg>@*" --sort=-v:refname`, first line).
3. If no such tag exists yet, or its version differs from the
   `package.json` version: this package was just bumped by a
   Version-Packages-PR merge.
   - `git tag "<pkg>@<version>"` and push it.
   - Extract the newest section of `<dir>/CHANGELOG.md` (the text
     between the top `## <version>` heading and the next `## `
     heading, or "No changelog entry." if the file/section is
     missing) as the release body.
   - `gh release create "<pkg>@<version>" --title "<pkg> v<version>"
     --notes-file <tmpfile>`.
   - Dispatch the matching build with the new version attached (see
     below) via `gh workflow run`.
4. If the version is unchanged, do nothing for that package - this is
   what makes the job a no-op on an ordinary feature-PR merge (nothing
   bumped `package.json` yet, since that only happens inside the
   Version PR branch).

Required job permissions: `contents: write` (create/push tags, create
releases), `actions: write` (dispatch the downstream workflows below).
Both come from the default `GITHUB_TOKEN` - no new secret.

### Why no race between the two jobs

- **Ordinary feature-PR merge** (adds a changeset, doesn't bump any
  version): `version` job sees pending changesets and opens/updates
  the Version PR. `tag-and-release` job compares versions, finds no
  diffs (nothing bumped yet), does nothing.
- **Version-Packages-PR merge** (the release): the merge already
  consumed/deleted the pending changeset files, so `version` job finds
  nothing pending and does nothing. `tag-and-release` job finds the
  version diffs the merge just introduced and acts on them.

Only one job ever does real work on a given push. This also means a
single push that happens to bump more than one package (the Version PR
batched changesets for both `api` and `web`, say) correctly tags and
releases both, independently.

### 5. Why dispatch instead of a tag-push trigger (avoiding a new secret)

The natural-looking alternative - give `ci.yaml`/`scan-app-mobile.yaml`
a `push: tags: [...]` trigger and let pushing the tag fire them - does
**not** work with the default `GITHUB_TOKEN`: GitHub Actions
deliberately does not chain a new workflow run off a push made *by* a
workflow run using the default token, to prevent runaway recursive
triggers. The usual fix is a separate PAT stored as a new repo secret.

Explicit dispatch avoids that entirely: `gh workflow run <file> --ref
main -f ...` is a direct API call (not a push-triggered event), so it
*is* allowed to start a new run using the calling job's own
`GITHUB_TOKEN`, as long as that job has `actions: write`. No new
secret needed.

### 6. `.github/workflows/ci.yaml` (modified)

Add one new optional `workflow_dispatch` input, `version` (string,
default `''`). In `build-api` and `build-web`'s `docker/metadata-action`
step, add one more conditional tag:

```yaml
type=raw,value=${{ inputs.version }},enable=${{ inputs.version != '' }}
```

So a manually-dispatched run (no `version` input) behaves exactly as
today (`latest` + branch-sha tags only); a release-triggered run also
gets tagged with the real version, e.g.
`ghcr.io/nomorechokedboy/qldt-api:1.2.3`.

`tag-and-release.mjs` dispatches these with:
`gh workflow run ci.yaml --ref main -f component=api -f version=1.2.3`
(or `component=web`).

### 7. `.github/workflows/scan-app-mobile.yaml` (modified)

Add one new optional `workflow_dispatch` input, `release_tag` (string,
default `''`). After each build step that produces installable output
(`Build signed release`, `Build debug APK`, `Build signed IPA`), add a
step that runs only when `inputs.release_tag != ''`:

```sh
gh release upload "${{ inputs.release_tag }}" <build-output-glob> --clobber
```

using the job's own `GITHUB_TOKEN` (needs `contents: write` added to
the job's `permissions`, since this job currently declares none). The
exact glob for each artifact needs confirming against this Tauri
version's real build output during implementation; best current guess:

- Android APK: `apps/scan-app/src-tauri/gen/android/app/build/outputs/apk/**/*.apk`
- Android AAB: `apps/scan-app/src-tauri/gen/android/app/build/outputs/bundle/**/*.aab`
- iOS IPA: `apps/scan-app/src-tauri/gen/apple/build/**/*.ipa`

`tag-and-release.mjs` dispatches this with:
`gh workflow run scan-app-mobile.yaml --ref main -f platform=all -f release_tag=scan-app@0.2.0`.

### 8. Docs (modified)

Add a short "Releasing" section to the root `README.md`: what
`pnpm changeset` does, that merging the Version Packages PR is the
release, and that `cron`/`sms-*` aren't covered yet.

## Error handling

- **Idempotent re-runs:** if `tag-and-release` fails partway (e.g. the
  `gh release create` step errors after the tag already pushed), a
  re-run of the job re-checks "does tag `X` exist" and "does release
  `X` exist" independently rather than assuming both-or-neither, so it
  can resume without trying to recreate an existing tag.
- **Dispatch failure:** if `gh workflow run` fails after a successful
  tag+release (e.g. a transient API error), that's logged clearly and
  the script continues to the next package, but the overall job still
  exits non-zero so the failure is visible in the Actions tab - a
  tagged-and-released-but-never-built package is worth surfacing, not
  swallowing.
- **No interdependencies:** none of `api`/`web`/`scan-app` depend on
  each other as workspace packages, so `updateInternalDependencies`
  never actually fires in practice here; it's set for correctness, not
  because it's expected to trigger.

## Testing / rollout plan

1. Locally: `pnpm changeset` to create a changeset for a trivial
   change, then `pnpm changeset version` locally to confirm the
   version bump and `CHANGELOG.md` generation work before anything
   touches CI.
2. Push the new workflow files and merge a PR with one real changeset
   (e.g. a `scan-app` patch bump, the lowest-stakes app to verify
   end-to-end since it's mobile-only artifacts, not a live Docker
   deploy). Confirm: Version PR opens with the right diff, merging it
   creates the tag, creates the GitHub Release with real changelog
   content, and dispatches `scan-app-mobile.yaml` with the right
   inputs.
3. Once that round-trips cleanly, verify `api`/`web` the same way and
   check the resulting Docker image actually carries the version tag
   in GHCR.
4. Purely additive change - existing manual `workflow_dispatch` runs
   of both workflows are untouched and keep working exactly as before,
   so there's no rollback risk beyond deleting the new workflow file
   and `.changeset/` config if something's wrong.
