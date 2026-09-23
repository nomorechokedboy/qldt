# Git Release Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `apps/api`, `apps/web`, and `apps/scan-app` independent semantic versions, auto-generated changelogs, git tags, and GitHub Releases, driven by a Changesets "Version Packages" PR that's opened/updated automatically on every push to `main`, with zero new GitHub secrets.

**Architecture:** Changesets (`@changesets/cli`) owns version bumps and changelogs, gated by a per-package `ignore` list so only the three in-scope apps are ever offered. A new `release.yaml` workflow runs two independent jobs on every push to `main`: one maintains the Version Packages PR (via `changesets/action@v1`), the other (`tag-and-release`) diffs each in-scope app's `package.json` version against its latest `<pkg>@*` git tag and, when it changed, tags it, cuts a GitHub Release from the new `CHANGELOG.md` section, and dispatches that app's existing build workflow (`ci.yaml` or `scan-app-mobile.yaml`) with the version attached via `gh workflow run` — sidestepping the `GITHUB_TOKEN` anti-recursion restriction on tag-push triggers without a new PAT.

**Tech Stack:** `@changesets/cli` + `@changesets/changelog-github` (Node/pnpm, no npm publishing), GitHub Actions (`changesets/action@v1`, `gh` CLI), a plain Node.js (`.mjs`, no extra deps) release script.

**Spec:** `docs/superpowers/specs/2026-09-23-git-release-automation-design.md` — this plan implements all 8 components of that spec; read it alongside this plan for the "why" behind each decision (especially the dispatch-vs-tag-trigger rationale in spec section 5, and the `platform=android` default in spec section 7).

## Global Constraints

- **No npm publishing anywhere.** Changesets is used purely as a version-bump + changelog engine.
- **No new GitHub secrets.** Everything runs on the default `GITHUB_TOKEN` with `contents: write` / `actions: write` permissions.
- **In scope:** `apps/api`, `apps/web`, `apps/scan-app` only. `deploy/cron`, `sms-api`, `sms-web`, and every non-JS/ignored `packages/*` entry are untouched.
- **`apps/web` starts at version `0.1.0`** (user-confirmed).
- Scan-app release dispatch uses `platform=android` (not `all`) — the iOS build job hard-fails without four `APPLE_*` secrets that aren't configured yet (see spec section 7).
- Existing manual `workflow_dispatch` behavior of `ci.yaml` and `scan-app-mobile.yaml` must be fully preserved — every change to them is additive (new optional input, defaulting to `''`/no-op).
- Formatting in this repo: tabs for indentation in JSON/YAML (see existing `package.json`, workflow files) — match the surrounding file's style in every edit.

---

### Task 1: Changesets tooling (config + root package.json)

**Files:**
- Create: `.changeset/config.json`
- Modify: `package.json` (root)

**Interfaces:**
- Produces: a working `pnpm changeset` command at the repo root; `.changeset/config.json` read by both the local CLI and `changesets/action@v1` in Task 4.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Create `.changeset/config.json`**

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

- [ ] **Step 2: Install Changesets as a root dev dependency**

Run from the repo root:

```sh
pnpm add -D -w @changesets/cli @changesets/changelog-github
```

(`-w` targets the workspace root, since this is a pnpm workspace and the repo root `package.json` has no `name`-scoped workspace membership of its own.) This adds both packages to root `devDependencies` at whatever their current published versions resolve to, and updates `pnpm-lock.yaml`.

- [ ] **Step 3: Add the `changeset` script to root `package.json`**

Current root `package.json` `scripts` block:

```json
	"scripts": {
		"build": "turbo run build",
		"dev": "turbo run dev",
		"lint": "turbo run lint",
		"format": "prettier --write \"**/*.{ts,tsx,md}\"",
		"prepare": "npx husky",
		"test": "turbo run test",
		"e2e": "pnpm --filter qldt-e2e e2e"
	},
```

Add one entry so it reads:

```json
	"scripts": {
		"build": "turbo run build",
		"dev": "turbo run dev",
		"lint": "turbo run lint",
		"format": "prettier --write \"**/*.{ts,tsx,md}\"",
		"prepare": "npx husky",
		"test": "turbo run test",
		"e2e": "pnpm --filter qldt-e2e e2e",
		"changeset": "changeset"
	},
```

- [ ] **Step 4: Verify the CLI reads the config without error**

Run: `pnpm changeset --help`
Expected: prints Changesets' own help text (no "config.json is invalid" or "cannot find module" error). This confirms both the install and `.changeset/config.json` are wired up correctly — no packages have been bumped yet.

- [ ] **Step 5: Commit**

```bash
git add .changeset/config.json package.json pnpm-lock.yaml
git commit -m "chore: add changesets tooling for per-app release versioning"
```

---

### Task 2: Starting version for `apps/web`

**Files:**
- Modify: `apps/web/package.json:1-4`

**Interfaces:**
- Produces: `apps/web/package.json` has a `version` field, which `scripts/release/tag-and-release.mjs` (Task 3) reads via `require`/`JSON.parse`.
- Consumes: nothing from other tasks.

`apps/web/package.json` currently has no `version` field at all:

```json
{
	"name": "web",
	"private": true,
	"type": "module",
	"scripts": {
```

- [ ] **Step 1: Add `"version": "0.1.0"`**

```json
{
	"name": "web",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"scripts": {
```

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('./apps/web/package.json').version)"`
Expected: prints `0.1.0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json
git commit -m "chore(web): add starting version 0.1.0 for release automation"
```

---

### Task 3: Release script (`scripts/release/tag-and-release.mjs`)

**Files:**
- Create: `scripts/release/tag-and-release.mjs`

**Interfaces:**
- Consumes: `version` field from `apps/api/package.json`, `apps/web/package.json` (Task 2), `apps/scan-app/package.json`; the `git`, `gh` CLIs on `$PATH`; env var `GH_TOKEN` (set by the workflow in Task 4) for `gh` auth.
- Produces: run via `node scripts/release/tag-and-release.mjs` from the repo root (no args, no stdout contract other than human-readable logs) by the `tag-and-release` job in `.github/workflows/release.yaml` (Task 4). Exits non-zero if any build dispatch fails, so the job surfaces as failed in the Actions tab even though tags/releases it already created stay in place (idempotent re-run behavior — see spec's "Error handling" section).

This script has no unit test framework in this repo to hook into (it's a CI-only script driving `git`/`gh` side effects against a live repo) — Step 5 below is a local dry-run against *this* repo's real tags (read-only up to the point it would tag/push), which is the correct-cost verification per the spec's own rollout plan (full behavioral verification happens via a real push, covered there).

- [ ] **Step 1: Write the script**

```js
#!/usr/bin/env node
// scripts/release/tag-and-release.mjs
//
// Run by .github/workflows/release.yaml's `tag-and-release` job on every
// push to main. Compares each release-tracked app's package.json version
// against its latest matching git tag; for any that moved (i.e. a Version
// Packages PR was just merged), creates the tag, cuts a GitHub Release
// from the new CHANGELOG.md section, and dispatches that app's build
// workflow with the version attached.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')

const APPS = [
	{
		pkg: 'api',
		dir: 'apps/api',
		dispatch: (version) => [
			'ci.yaml',
			['-f', 'component=api', '-f', `version=${version}`]
		]
	},
	{
		pkg: 'web',
		dir: 'apps/web',
		dispatch: (version) => [
			'ci.yaml',
			['-f', 'component=web', '-f', `version=${version}`]
		]
	},
	{
		pkg: 'scan-app',
		dir: 'apps/scan-app',
		// platform=android, not all: the iOS build job hard-fails without
		// four APPLE_* secrets that aren't configured yet. Switch to 'all'
		// once Apple signing is set up (see spec section 7).
		dispatch: (version) => [
			'scan-app-mobile.yaml',
			['-f', 'platform=android', '-f', `release_tag=scan-app@${version}`]
		]
	}
]

function sh(cmd, args) {
	return execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: 'utf-8' }).trim()
}

function readVersion(dir) {
	const pkgPath = path.join(REPO_ROOT, dir, 'package.json')
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
	if (!pkg.version) {
		throw new Error(`${pkgPath} has no "version" field`)
	}
	return pkg.version
}

// Latest existing tag for this package, or null if it has never been
// released. --sort=-v:refname orders by semver descending so the first
// line is the newest.
function latestTag(pkgName) {
	const out = sh('git', ['tag', '-l', `${pkgName}@*`, '--sort=-v:refname'])
	const first = out.split('\n')[0]?.trim()
	return first || null
}

function tagVersion(tag, pkgName) {
	return tag.slice(`${pkgName}@`.length)
}

function tagExists(tag) {
	try {
		sh('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`])
		return true
	} catch {
		return false
	}
}

function releaseExists(tag) {
	try {
		sh('gh', ['release', 'view', tag])
		return true
	} catch {
		return false
	}
}

// The section of CHANGELOG.md for `version` - the text between its own
// "## <version>" heading and the next "## " heading (or end of file).
function changelogSection(dir, version) {
	const changelogPath = path.join(REPO_ROOT, dir, 'CHANGELOG.md')
	if (!existsSync(changelogPath)) return 'No changelog entry.'

	const lines = readFileSync(changelogPath, 'utf-8').split('\n')
	const startIdx = lines.findIndex((l) => l.trim() === `## ${version}`)
	if (startIdx === -1) return 'No changelog entry.'

	let endIdx = lines.length
	for (let i = startIdx + 1; i < lines.length; i++) {
		if (lines[i].startsWith('## ')) {
			endIdx = i
			break
		}
	}
	const section = lines
		.slice(startIdx + 1, endIdx)
		.join('\n')
		.trim()
	return section || 'No changelog entry.'
}

function createTagAndRelease(app, version) {
	const tag = `${app.pkg}@${version}`

	if (!tagExists(tag)) {
		console.log(`Creating tag ${tag}`)
		sh('git', ['tag', tag])
		sh('git', ['push', 'origin', tag])
	} else {
		console.log(`Tag ${tag} already exists, skipping tag creation`)
	}

	if (!releaseExists(tag)) {
		console.log(`Creating GitHub Release ${tag}`)
		const notes = changelogSection(app.dir, version)
		const notesPath = path.join(REPO_ROOT, `.release-notes-${app.pkg}.md`)
		writeFileSync(notesPath, notes)
		try {
			sh('gh', [
				'release',
				'create',
				tag,
				'--title',
				`${app.pkg} v${version}`,
				'--notes-file',
				notesPath
			])
		} finally {
			unlinkSync(notesPath)
		}
	} else {
		console.log(`Release ${tag} already exists, skipping release creation`)
	}

	return tag
}

function dispatchBuild(app, version, tag, failures) {
	const [workflow, extraArgs] = app.dispatch(version)
	console.log(`Dispatching ${workflow} for ${tag}`)
	try {
		sh('gh', ['workflow', 'run', workflow, '--ref', 'main', ...extraArgs])
	} catch (err) {
		// Tag + release already succeeded; a failed dispatch means the build
		// has to be started by hand, so this is surfaced loudly rather than
		// swallowed, but it doesn't stop the other apps in this run.
		console.error(
			`::error::Failed to dispatch ${workflow} for ${tag}: ${err.message}`
		)
		failures.push(tag)
	}
}

function main() {
	const failures = []
	let releasedAny = false

	for (const app of APPS) {
		const version = readVersion(app.dir)
		const existingTag = latestTag(app.pkg)
		const existingVersion = existingTag
			? tagVersion(existingTag, app.pkg)
			: null

		if (existingVersion === version) {
			console.log(`${app.pkg}: version ${version} already released, skipping`)
			continue
		}

		console.log(
			`${app.pkg}: version changed (${existingVersion ?? '(none)'} -> ${version})`
		)
		releasedAny = true
		const tag = createTagAndRelease(app, version)
		dispatchBuild(app, version, tag, failures)
	}

	if (!releasedAny) {
		console.log('No package versions changed - nothing to release.')
	}

	if (failures.length > 0) {
		console.error(`::error::Build dispatch failed for: ${failures.join(', ')}`)
		process.exit(1)
	}
}

main()
```

- [ ] **Step 2: Syntax-check it**

Run: `node --check scripts/release/tag-and-release.mjs`
Expected: no output, exit code 0.

- [ ] **Step 3: Dry-run the version/tag-diff logic against this real repo (read-only)**

None of `api`, `web`, `scan-app` have any `<pkg>@*` tags yet (this feature hasn't shipped), so every app should be reported as "version changed (none) -> X" — but the script would then try to `git push origin <tag>` and call `gh`, neither of which should actually run yet outside CI. Verify the read-only part (`readVersion`/`latestTag`) directly instead of running `main()`:

```sh
node -e "
import('./scripts/release/tag-and-release.mjs').catch(() => {}); // syntax already checked above
" 2>&1 | true
node -e "
const { execFileSync } = require('node:child_process');
for (const [pkg, dir] of [['api','apps/api'],['web','apps/web'],['scan-app','apps/scan-app']]) {
  const version = JSON.parse(require('node:fs').readFileSync(dir + '/package.json', 'utf-8')).version;
  let tag;
  try { tag = execFileSync('git', ['tag', '-l', pkg + '@*', '--sort=-v:refname'], { encoding: 'utf-8' }).trim().split('\n')[0] || '(none)'; }
  catch { tag = '(error)'; }
  console.log(pkg, 'version=' + version, 'latestTag=' + tag);
}
"
```

Expected output (three lines, one per app): `api version=0.0.1 latestTag=(none)`, `web version=0.1.0 latestTag=(none)`, `scan-app version=0.1.0 latestTag=(none)` — confirming the diff logic would treat all three as "just released" on the first real run, which is correct (nothing has been tagged yet). Full end-to-end behavior (tag push, release creation, dispatch) is verified for real in the spec's rollout plan after Task 4 lands, since it requires a real GitHub remote and `gh` auth that aren't available in this local check.

- [ ] **Step 4: Commit**

```bash
git add scripts/release/tag-and-release.mjs
git commit -m "feat(release): add per-app tag-and-release script"
```

---

### Task 4: Release workflow (`.github/workflows/release.yaml`)

**Files:**
- Create: `.github/workflows/release.yaml`

**Interfaces:**
- Consumes: `.changeset/config.json` (Task 1), `scripts/release/tag-and-release.mjs` (Task 3), the `version`/`release_tag` inputs added to `ci.yaml`/`scan-app-mobile.yaml` (Tasks 5-6 — this workflow dispatches those by name, so it works correctly only once Tasks 5-6 also land, though it's safe to merge in any order since a missing input just gets ignored by the target workflow's own default).
- Produces: nothing consumed by a later task — this is the top-level entry point.

- [ ] **Step 1: Write the workflow**

```yaml
name: Release
on:
    push:
        branches: [main]
concurrency:
    group: release-${{ github.ref }}
    cancel-in-progress: false
jobs:
    version:
        runs-on: ubuntu-latest
        permissions:
            contents: write
            pull-requests: write
        steps:
            - name: Checkout repository
              uses: actions/checkout@v4
            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 24
            - name: Install pnpm
              uses: pnpm/action-setup@v4
            - name: Setup pnpm store path
              id: pnpm-store
              run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
            - name: Cache pnpm store
              uses: actions/cache@v4
              with:
                  path: ${{ steps.pnpm-store.outputs.STORE_PATH }}
                  key: ${{ runner.os }}-pnpm-store-${{ hashFiles('pnpm-lock.yaml') }}
                  restore-keys: |
                      ${{ runner.os }}-pnpm-store-
            - name: Install dependencies
              run: pnpm install --frozen-lockfile
            - name: Create/update Version Packages PR
              uses: changesets/action@v1
              with:
                  version: pnpm changeset version
                  title: 'chore: version packages'
                  commit: 'chore: version packages'
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    tag-and-release:
        runs-on: ubuntu-latest
        permissions:
            contents: write
            actions: write
        steps:
            - name: Checkout repository
              uses: actions/checkout@v4
              with:
                  fetch-depth: 0
            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 24
            - name: Tag and release changed packages
              run: node scripts/release/tag-and-release.mjs
              env:
                  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Two independent jobs by design: on an ordinary feature-PR merge (adds a changeset, no version bump yet), `version` opens/updates the Version PR and `tag-and-release` finds no version diffs and does nothing; on a Version-Packages-PR merge (the actual release), the merge already consumed the pending changesets so `version` finds nothing pending, while `tag-and-release` finds the version diffs and acts. See spec section "Why no race between the two jobs" for the full reasoning.

`fetch-depth: 0` on the `tag-and-release` checkout is required — `scripts/release/tag-and-release.mjs` reads existing tags via `git tag -l`, which needs full history, not the default shallow clone.

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yaml'))" && echo OK`
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yaml
git commit -m "feat(release): add release workflow (version PR + tag-and-release)"
```

---

### Task 5: `ci.yaml` — optional version tag on dispatch

**Files:**
- Modify: `.github/workflows/ci.yaml:1-13` (add input), `.github/workflows/ci.yaml:128-135` (build-api metadata step), `.github/workflows/ci.yaml:174-181` (build-web metadata step)

**Interfaces:**
- Consumes: called via `gh workflow run ci.yaml --ref main -f component=<api|web> -f version=<semver>` from `scripts/release/tag-and-release.mjs` (Task 3).
- Produces: nothing consumed by a later task.

- [ ] **Step 1: Add the `version` input**

Current (`ci.yaml:2-13`):

```yaml
on:
    workflow_dispatch:
        inputs:
            component:
                description: What to test and build
                type: choice
                options:
                    - all
                    - api
                    - web
                    - cron
                default: all
```

New:

```yaml
on:
    workflow_dispatch:
        inputs:
            component:
                description: What to test and build
                type: choice
                options:
                    - all
                    - api
                    - web
                    - cron
                default: all
            version:
                description: 'Version to tag the built image with (set by the release workflow; leave blank for a manual run)'
                type: string
                default: ''
```

- [ ] **Step 2: Add the conditional tag to `build-api`'s metadata step**

Current (`ci.yaml:128-135`):

```yaml
            - name: Extract metadata
              id: meta
              uses: docker/metadata-action@v5
              with:
                  images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/qldt-api
                  tags: |
                      type=raw,value=latest
                      type=sha,prefix={{branch}}-
```

New:

```yaml
            - name: Extract metadata
              id: meta
              uses: docker/metadata-action@v5
              with:
                  images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/qldt-api
                  tags: |
                      type=raw,value=latest
                      type=sha,prefix={{branch}}-
                      type=raw,value=${{ inputs.version }},enable=${{ inputs.version != '' }}
```

- [ ] **Step 3: Add the same conditional tag to `build-web`'s metadata step**

Current (`ci.yaml:174-181`):

```yaml
            - name: Extract metadata
              id: meta
              uses: docker/metadata-action@v5
              with:
                  images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/qldt-web
                  tags: |
                      type=raw,value=latest
                      type=sha,prefix={{branch}}-
```

New:

```yaml
            - name: Extract metadata
              id: meta
              uses: docker/metadata-action@v5
              with:
                  images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/qldt-web
                  tags: |
                      type=raw,value=latest
                      type=sha,prefix={{branch}}-
                      type=raw,value=${{ inputs.version }},enable=${{ inputs.version != '' }}
```

- [ ] **Step 4: Validate YAML syntax and that manual-dispatch behavior is unchanged**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yaml'))" && echo OK`
Expected: `OK`.

Confirm by inspection: `build-cron`'s metadata step (untouched, no `version` input reference) and every other job are unmodified — `git diff --stat .github/workflows/ci.yaml` should show only the three hunks above (one `on.workflow_dispatch.inputs` addition, two one-line additions inside `build-api`/`build-web`).

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yaml
git commit -m "feat(ci): accept optional version input for release-triggered builds"
```

---

### Task 6: `scan-app-mobile.yaml` — optional release upload on dispatch

**Files:**
- Modify: `.github/workflows/scan-app-mobile.yaml:2-12` (add input), `.github/workflows/scan-app-mobile.yaml:16` (build-android permissions), `.github/workflows/scan-app-mobile.yaml:99` area (build-android upload step), `.github/workflows/scan-app-mobile.yaml:100` (build-ios permissions), end of `build-ios` steps (upload step)

**Interfaces:**
- Consumes: called via `gh workflow run scan-app-mobile.yaml --ref main -f platform=android -f release_tag=scan-app@<semver>` from `scripts/release/tag-and-release.mjs` (Task 3).
- Produces: nothing consumed by a later task.

- [ ] **Step 1: Add the `release_tag` input**

Current (`scan-app-mobile.yaml:2-12`):

```yaml
on:
    workflow_dispatch:
        inputs:
            platform:
                description: Platform to build
                type: choice
                options:
                    - all
                    - android
                    - ios
                default: all
```

New:

```yaml
on:
    workflow_dispatch:
        inputs:
            platform:
                description: Platform to build
                type: choice
                options:
                    - all
                    - android
                    - ios
                default: all
            release_tag:
                description: 'GitHub Release tag to upload the build to (set by the release workflow; leave blank for a manual run)'
                type: string
                default: ''
```

- [ ] **Step 2: Add `permissions: contents: write` to `build-android`**

Current (`scan-app-mobile.yaml:16-20`):

```yaml
    build-android:
        if: inputs.platform == 'all' || inputs.platform == 'android'
        runs-on: ubuntu-latest
        env:
            ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
```

New:

```yaml
    build-android:
        if: inputs.platform == 'all' || inputs.platform == 'android'
        runs-on: ubuntu-latest
        permissions:
            contents: write
        env:
            ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
```

- [ ] **Step 3: Add an upload step at the end of `build-android`**

After the last step in `build-android` (`Build debug APK (no keystore configured)`, currently the job's final step):

```yaml
            - name: Upload build to release
              if: inputs.release_tag != ''
              env:
                  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              run: |
                  shopt -s globstar nullglob
                  files=(apps/scan-app/src-tauri/gen/android/app/build/outputs/apk/**/*.apk apps/scan-app/src-tauri/gen/android/app/build/outputs/bundle/**/*.aab)
                  if [ ${#files[@]} -eq 0 ]; then
                      echo "::error::No Android build output found to upload"
                      exit 1
                  fi
                  gh release upload "${{ inputs.release_tag }}" "${files[@]}" --clobber
```

A single trailing step (rather than one after each of the two mutually-exclusive Android build steps) covers both the signed and debug build paths uniformly: whichever ran, this globs whatever output exists. The glob paths are the plan's best-guess match for this Tauri version's real output layout (per spec section 7) — if a real release run reports "No Android build output found," check the actual paths with `find apps/scan-app/src-tauri/gen/android/app/build/outputs -name '*.apk' -o -name '*.aab'` on a build run and adjust here.

- [ ] **Step 4: Add `permissions: contents: write` to `build-ios`**

Current (`scan-app-mobile.yaml:100-105`):

```yaml
    build-ios:
        if: inputs.platform == 'all' || inputs.platform == 'ios'
        runs-on: macos-latest
        env:
            APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
            APPLE_DEVELOPMENT_TEAM: ${{ secrets.APPLE_DEVELOPMENT_TEAM }}
```

New:

```yaml
    build-ios:
        if: inputs.platform == 'all' || inputs.platform == 'ios'
        runs-on: macos-latest
        permissions:
            contents: write
        env:
            APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
            APPLE_DEVELOPMENT_TEAM: ${{ secrets.APPLE_DEVELOPMENT_TEAM }}
```

- [ ] **Step 5: Add an upload step at the end of `build-ios`**

After the job's last step (`Build signed IPA`):

```yaml
            - name: Upload build to release
              if: inputs.release_tag != ''
              env:
                  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
              run: |
                  shopt -s globstar nullglob
                  files=(apps/scan-app/src-tauri/gen/apple/build/**/*.ipa)
                  if [ ${#files[@]} -eq 0 ]; then
                      echo "::error::No iOS build output found to upload"
                      exit 1
                  fi
                  gh release upload "${{ inputs.release_tag }}" "${files[@]}" --clobber
```

Same caveat as Android: this glob is a best guess, to be confirmed against a real signed build once Apple secrets are configured (this job currently hard-fails on the `Require Apple credentials` step without them, per Global Constraints, so it won't actually run end-to-end yet).

- [ ] **Step 6: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/scan-app-mobile.yaml'))" && echo OK`
Expected: `OK`.

Confirm by inspection: `git diff --stat .github/workflows/scan-app-mobile.yaml` shows exactly the five hunks above (one input addition, two `permissions` blocks, two upload steps) and nothing else changed in the existing build/signing steps.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/scan-app-mobile.yaml
git commit -m "feat(scan-app-mobile): upload build to release on release-triggered dispatch"
```

---

### Task 7: README "Releasing" section

**Files:**
- Modify: `README.md` (root) — insert a new `## Releasing` section after the existing `## CI/CD` section (currently ending at line 138, before `## Conventions` at line 140)

**Interfaces:**
- Consumes: nothing (pure documentation).
- Produces: nothing consumed by a later task.

Current (`README.md:136-140`):

```markdown
## CI/CD

`.github/workflows/ci.yaml` runs on push to `main`. It uses `dorny/paths-filter` to detect which of `api` / `web` / `sms-api` / `sms-web` changed, then builds and pushes only the affected image(s) to `ghcr.io/<owner>/<image>:latest` and `:<branch>-<sha>`. `sms-web` builds twice (`wan`/`lan` matrix) against different GitHub Environments, since it needs different `VITE_*` build args per network.

## Conventions
```

(Note: this existing paragraph describes `dorny/paths-filter`/push-triggered behavior that no longer matches `ci.yaml`'s actual `workflow_dispatch`-only, manual-component-choice design — that's a pre-existing inaccuracy in this README, out of scope for this plan to fix. Leave it as-is; only insert the new section below it.)

- [ ] **Step 1: Insert the "Releasing" section**

```markdown
## CI/CD

`.github/workflows/ci.yaml` runs on push to `main`. It uses `dorny/paths-filter` to detect which of `api` / `web` / `sms-api` / `sms-web` changed, then builds and pushes only the affected image(s) to `ghcr.io/<owner>/<image>:latest` and `:<branch>-<sha>`. `sms-web` builds twice (`wan`/`lan` matrix) against different GitHub Environments, since it needs different `VITE_*` build args per network.

## Releasing

`apps/api`, `apps/web`, and `apps/scan-app` version independently via [Changesets](https://github.com/changesets/changesets) — `cron`, `sms-api`, `sms-web` aren't covered yet.

1. In a PR that changes one or more of those apps, run `pnpm changeset` once and answer its prompts (which package(s) changed, what kind of bump, a one-line summary). Commit the generated `.changeset/*.md` file with the PR.
2. Merge the PR to `main` as normal.
3. `.github/workflows/release.yaml` keeps a standing **"Version Packages"** PR up to date on every push to `main` whenever changesets are pending — it batches them into a `package.json` version bump and a `CHANGELOG.md` entry per affected app.
4. Merging the Version Packages PR *is* the release: it tags the changed app(s) (`api@x.y.z` / `web@x.y.z` / `scan-app@x.y.z`), creates a GitHub Release with the new changelog section, and dispatches that app's build with the version attached (a versioned Docker tag in GHCR for `api`/`web`, a versioned mobile build upload for `scan-app`).

`pnpm changeset` and everything above only ever offers `api`, `web`, and `scan-app` — every other workspace member is listed in `.changeset/config.json`'s `ignore` array and never appears in the prompt.

## Conventions
```

- [ ] **Step 2: Verify placement**

Run: `grep -n "^## " README.md`
Expected: `## Releasing` appears between `## CI/CD` and `## Conventions` in the output list.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document the per-app release flow"
```

---

## Self-Review

**Spec coverage:** all 8 components from the approved spec map onto a task — Component 1 (`.changeset/config.json`) → Task 1; Component 2 (root `package.json`) → Task 1; Component 3 (`apps/web/package.json` version) → Task 2; Component 4 (`release.yaml` + `tag-and-release.mjs`) → Tasks 3-4; Component 5 (dispatch rationale) → documented inline in Task 4, no separate artifact needed; Component 6 (`ci.yaml`) → Task 5; Component 7 (`scan-app-mobile.yaml`) → Task 6; Component 8 (README) → Task 7.

**Placeholder scan:** no "TBD"/"implement later"/hand-waved steps — every task shows exact file content, exact diffs anchored to real current line numbers (re-read from the live files during planning), and a concrete verification command per step.

**Type/interface consistency:** the `APPS` array in Task 3's script (`pkg`/`dir`/`dispatch` keys, `api`/`web`/`scan-app`) matches the tag scheme (`<pkg>@<version>`) referenced in Task 4's workflow comments and Task 7's README; the `version`/`release_tag` input names and their `gh workflow run -f` flags in Task 3's `dispatch()` functions match exactly what Tasks 5-6 add to `ci.yaml`/`scan-app-mobile.yaml`'s `workflow_dispatch.inputs`. `platform=android` (not `all`) is consistent between the spec amendment, Task 3's script comment, and Task 6.

No gaps found.
