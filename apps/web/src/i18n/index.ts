import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import viAuth from './locales/vi/auth'
import viCommon from './locales/vi/common'
import viNav from './locales/vi/nav'
import viStudent from './locales/vi/student'
import viTable from './locales/vi/table'
import enAuth from './locales/en/auth'
import enCommon from './locales/en/common'
import enNav from './locales/en/nav'
import enStudent from './locales/en/student'
import enTable from './locales/en/table'

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
		table: viTable,
		student: viStudent
	},
	en: {
		common: enCommon,
		auth: enAuth,
		nav: enNav,
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

i18n.use(initReactI18next).init({
	resources,
	lng: readStoredLanguage(),
	fallbackLng: DEFAULT_LANGUAGE,
	defaultNS: 'common',
	ns: Object.keys(resources.vi),
	interpolation: { escapeValue: false }
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
