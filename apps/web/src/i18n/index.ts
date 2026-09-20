import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import viAuth from './locales/vi/auth'
import viCommon from './locales/vi/common'
import viLangPacks from './locales/vi/langPacks'
import viNav from './locales/vi/nav'
import viStudent from './locales/vi/student'
import viTable from './locales/vi/table'
import viUnits from './locales/vi/units'
import viMaterials from './locales/vi/materials'
import viProposals from './locales/vi/proposals'
import viAdmin from './locales/vi/admin'
import viStats from './locales/vi/stats'
import viIo from './locales/vi/io'
import enAuth from './locales/en/auth'
import enCommon from './locales/en/common'
import enLangPacks from './locales/en/langPacks'
import enNav from './locales/en/nav'
import enStudent from './locales/en/student'
import enTable from './locales/en/table'
import enUnits from './locales/en/units'
import enMaterials from './locales/en/materials'
import enProposals from './locales/en/proposals'
import enAdmin from './locales/en/admin'
import enStats from './locales/en/stats'
import enIo from './locales/en/io'

export const LANGUAGES = [
	{ code: 'vi', label: 'Tiếng Việt', short: 'VI' },
	{ code: 'en', label: 'English', short: 'EN' }
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'qldt.lang'
const DEFAULT_LANGUAGE: LanguageCode = 'vi'

export const resources = {
	vi: {
		common: viCommon,
		auth: viAuth,
		nav: viNav,
		langPacks: viLangPacks,
		units: viUnits,
		materials: viMaterials,
		proposals: viProposals,
		admin: viAdmin,
		stats: viStats,
		io: viIo,
		table: viTable,
		student: viStudent
	},
	en: {
		common: enCommon,
		auth: enAuth,
		nav: enNav,
		langPacks: enLangPacks,
		units: enUnits,
		materials: enMaterials,
		proposals: enProposals,
		admin: enAdmin,
		stats: enStats,
		io: enIo,
		table: enTable,
		student: enStudent
	}
} as const

function isLanguage(code: unknown): code is LanguageCode {
	return LANGUAGES.some((l) => l.code === code)
}

// Storage can throw (private windows, blocked site data); Vietnamese is the
// app's language, so anything unreadable falls back to it.
function readStoredLanguage(): LanguageCode {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (isLanguage(stored)) return stored
	} catch {
		// fall through to the default
	}
	return DEFAULT_LANGUAGE
}

// i18next keeps the objects it is given and merges language packs into them,
// so it gets its own copy and `resources` stays the pristine built-in catalog
// (used to restore defaults and to build the downloadable template).
i18n.use(initReactI18next).init({
	resources: structuredClone(resources),
	lng: readStoredLanguage(),
	fallbackLng: DEFAULT_LANGUAGE,
	defaultNS: 'common',
	ns: Object.keys(resources.vi),
	interpolation: { escapeValue: false },
	// language packs arrive after first render, so components must re-render
	// when bundles are added or removed
	react: { bindI18nStore: 'added removed' }
})

function syncDocumentLanguage(code: string) {
	document.documentElement.lang = code
}

syncDocumentLanguage(i18n.language)
i18n.on('languageChanged', (code) => {
	syncDocumentLanguage(code)
	try {
		localStorage.setItem(STORAGE_KEY, code)
	} catch {
		// the choice just won't persist
	}
})

export default i18n
