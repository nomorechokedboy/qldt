import { AppError } from '../errors'
import { LangPackData, LangPackTree } from '../schema/lang-packs'

export const LANG_PACK_LANGUAGES = ['vi', 'en'] as const
export type LangPackLanguage = (typeof LANG_PACK_LANGUAGES)[number]

export const MAX_LANG_PACK_BYTES = 256 * 1024

const MAX_DEPTH = 8
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseLanguage(value: string): LangPackLanguage {
	if (!(LANG_PACK_LANGUAGES as readonly string[]).includes(value)) {
		throw AppError.invalidArgument(
			`Ngôn ngữ không được hỗ trợ: ${value}. Chỉ hỗ trợ ${LANG_PACK_LANGUAGES.join(', ')}`
		)
	}
	return value as LangPackLanguage
}

function checkTree(node: unknown, path: string, depth: number): LangPackTree {
	if (!isPlainObject(node)) {
		throw AppError.invalidArgument(
			`"${path}" phải là một đối tượng chứa các chuỗi`
		)
	}
	if (depth > MAX_DEPTH) {
		throw AppError.invalidArgument(`"${path}" lồng quá sâu`)
	}

	const tree: LangPackTree = {}
	for (const [key, value] of Object.entries(node)) {
		const keyPath = `${path}.${key}`
		if (FORBIDDEN_KEYS.has(key)) {
			throw AppError.invalidArgument(`Khóa không hợp lệ: "${keyPath}"`)
		}
		if (typeof value === 'string') {
			tree[key] = value
		} else {
			tree[key] = checkTree(value, keyPath, depth + 1)
		}
	}
	return tree
}

// Structural validation only: the API can't know the web catalog's keys, so
// filtering keys that don't exist is left to the uploader (which does have
// the catalog). Anything stored here is only ever looked up by key, so an
// unknown key is inert.
export function validateLangPack(input: unknown): LangPackData {
	if (!isPlainObject(input)) {
		throw AppError.invalidArgument(
			'Gói ngôn ngữ phải là một đối tượng JSON theo dạng { "namespace": { "khóa": "giá trị" } }'
		)
	}

	if (Buffer.byteLength(JSON.stringify(input)) > MAX_LANG_PACK_BYTES) {
		throw AppError.invalidArgument(
			`Gói ngôn ngữ vượt quá ${MAX_LANG_PACK_BYTES / 1024} KB`
		)
	}

	const pack: LangPackData = {}
	for (const [namespace, tree] of Object.entries(input)) {
		if (
			!/^[A-Za-z][\w-]*$/.test(namespace) ||
			FORBIDDEN_KEYS.has(namespace)
		) {
			throw AppError.invalidArgument(
				`Tên namespace không hợp lệ: "${namespace}"`
			)
		}
		const checked = checkTree(tree, namespace, 1)
		if (Object.keys(checked).length > 0) {
			pack[namespace] = checked
		}
	}

	if (Object.keys(pack).length === 0) {
		throw AppError.invalidArgument('Gói ngôn ngữ không có chuỗi nào')
	}

	return pack
}
