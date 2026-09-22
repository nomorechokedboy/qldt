// The app's own Vietnamese strings, so a test looks things up by the same key
// the UI renders (`t('units:initialize.rootUnit.name')`) instead of repeating
// the copy. When a label is reworded the tests follow; when a key is removed
// the lookup throws and points at it.
import admin from '../../web/src/i18n/locales/vi/admin'
import auth from '../../web/src/i18n/locales/vi/auth'
import common from '../../web/src/i18n/locales/vi/common'
import errors from '../../web/src/i18n/locales/vi/errors'
import io from '../../web/src/i18n/locales/vi/io'
import langPacks from '../../web/src/i18n/locales/vi/langPacks'
import materials from '../../web/src/i18n/locales/vi/materials'
import nav from '../../web/src/i18n/locales/vi/nav'
import proposals from '../../web/src/i18n/locales/vi/proposals'
import stats from '../../web/src/i18n/locales/vi/stats'
import student from '../../web/src/i18n/locales/vi/student'
import table from '../../web/src/i18n/locales/vi/table'
import units from '../../web/src/i18n/locales/vi/units'

const namespaces: Record<string, unknown> = {
	admin,
	auth,
	common,
	errors,
	io,
	langPacks,
	materials,
	nav,
	proposals,
	stats,
	student,
	table,
	units
}

export function t(key: string, vars: Record<string, string | number> = {}) {
	const [ns, path] = key.split(':')
	let node: unknown = namespaces[ns]
	for (const part of (path ?? '').split('.')) {
		node = (node as Record<string, unknown> | undefined)?.[part]
	}
	if (typeof node !== 'string') {
		throw new Error(`No Vietnamese text for "${key}"`)
	}
	return node.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ''))
}
