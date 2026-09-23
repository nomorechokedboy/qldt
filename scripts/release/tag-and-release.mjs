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
