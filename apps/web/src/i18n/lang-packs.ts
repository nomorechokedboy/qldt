import i18n, { LANGUAGES, resources, type LanguageCode } from '.'

// A language pack is a sparse override of the built-in catalog:
// { [namespace]: { [key]: string | nested keys } }.
export type LangPackTree = { [key: string]: string | LangPackTree }
export type LangPackData = Record<string, LangPackTree>

// Keep in step with MAX_LANG_PACK_BYTES in apps/api/lang-packs/validate.ts.
export const MAX_LANG_PACK_KB = 256

// Carries an already-translated message meant to be shown to the admin as is.
export class LangPackFileError extends Error {}

export interface LangPackAnalysis {
	pack: LangPackData
	applied: number
	// dotted paths that don't exist in the built-in catalog (or have the wrong
	// shape) and were dropped
	ignored: string[]
	// paths whose {{placeholders}} differ from the built-in string
	placeholderMismatches: string[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function placeholdersOf(text: string): string {
	return [...text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)]
		.map((m) => m[1])
		.sort()
		.join(',')
}

function builtIn(lang: LanguageCode): LangPackData {
	return resources[lang] as unknown as LangPackData
}

// Keeps only what the built-in catalog also has, at the same shape.
function prune(
	node: Record<string, unknown>,
	reference: LangPackTree,
	path: string,
	report: LangPackAnalysis
): LangPackTree {
	const kept: LangPackTree = {}

	for (const [key, value] of Object.entries(node)) {
		const keyPath = path ? `${path}.${key}` : key
		const ref = Object.hasOwn(reference, key) ? reference[key] : undefined

		if (ref === undefined) {
			report.ignored.push(keyPath)
		} else if (typeof value === 'string') {
			if (typeof ref !== 'string') {
				report.ignored.push(keyPath)
				continue
			}
			kept[key] = value
			report.applied++
			if (placeholdersOf(value) !== placeholdersOf(ref)) {
				report.placeholderMismatches.push(keyPath)
			}
		} else if (isPlainObject(value)) {
			if (typeof ref === 'string') {
				report.ignored.push(keyPath)
				continue
			}
			const child = prune(value, ref, keyPath, report)
			if (Object.keys(child).length > 0) kept[key] = child
		} else {
			throw new LangPackFileError(
				i18n.t('langPacks:errors.invalidValue', { path: keyPath })
			)
		}
	}

	return kept
}

// Validates an uploaded pack against the built-in catalog of `lang` and drops
// everything the app would never read.
export function analyzeLangPack(
	input: unknown,
	lang: LanguageCode
): LangPackAnalysis {
	if (!isPlainObject(input)) {
		throw new LangPackFileError(i18n.t('langPacks:errors.notObject'))
	}

	const catalog = builtIn(lang)
	const report: LangPackAnalysis = {
		pack: {},
		applied: 0,
		ignored: [],
		placeholderMismatches: []
	}

	for (const [ns, tree] of Object.entries(input)) {
		if (!Object.hasOwn(catalog, ns)) {
			report.ignored.push(ns)
		} else if (!isPlainObject(tree)) {
			throw new LangPackFileError(
				i18n.t('langPacks:errors.invalidValue', { path: ns })
			)
		} else {
			const kept = prune(tree, catalog[ns], ns, report)
			if (Object.keys(kept).length > 0) report.pack[ns] = kept
		}
	}

	if (report.applied === 0) {
		throw new LangPackFileError(i18n.t('langPacks:errors.nothingToApply'))
	}

	return report
}

export function analyzeLangPackFile(
	file: File,
	text: string,
	lang: LanguageCode
): LangPackAnalysis {
	if (!file.name.toLowerCase().endsWith('.json')) {
		throw new LangPackFileError(i18n.t('langPacks:errors.notJsonFile'))
	}
	if (file.size > MAX_LANG_PACK_KB * 1024) {
		throw new LangPackFileError(
			i18n.t('langPacks:errors.tooLarge', { kb: MAX_LANG_PACK_KB })
		)
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(text)
	} catch {
		throw new LangPackFileError(i18n.t('langPacks:errors.notJson'))
	}
	return analyzeLangPack(parsed, lang)
}

// The full built-in catalog for a language, shaped exactly like an upload.
export function buildLangPackTemplate(lang: LanguageCode): string {
	return JSON.stringify(builtIn(lang), null, 2)
}

// "lng/ns" -> the pack tree currently merged over the built-in bundle (as
// JSON), so re-applying the same packs is a no-op.
const overlaid = new Map<string, string>()

// Merges the server's packs over the built-in catalog and restores the
// built-in text for any language/namespace that no longer has an override.
export function applyLangPacks(packs: Partial<Record<string, LangPackData>>) {
	for (const { code } of LANGUAGES) {
		const overlay = packs[code]

		for (const ns of Object.keys(resources[code])) {
			const key = `${code}/${ns}`
			const tree = overlay?.[ns]
			const safe = isPlainObject(tree)
				? prune(tree, builtIn(code)[ns], '', {
						pack: {},
						applied: 0,
						ignored: [],
						placeholderMismatches: []
					})
				: undefined
			const signature =
				safe && Object.keys(safe).length > 0
					? JSON.stringify(safe)
					: undefined

			if (overlaid.get(key) === signature) continue

			i18n.removeResourceBundle(code, ns)
			i18n.addResourceBundle(code, ns, structuredClone(builtIn(code)[ns]))
			overlaid.delete(key)

			if (safe && signature) {
				i18n.addResourceBundle(code, ns, safe, true, true)
				overlaid.set(key, signature)
			}
		}
	}
}
