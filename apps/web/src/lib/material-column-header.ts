import i18n from '@/i18n'
import type { ParseKeys } from 'i18next'

// A column header (and its view-options label) that follows the active
// language: built-in column arrays are created once, so the text has to be
// resolved when it is rendered rather than when the column is defined.
export function localizedHeader(key: ParseKeys<'materials'>) {
	const translate = () => i18n.t(key, { ns: 'materials' })
	return {
		header: translate,
		meta: {
			get label() {
				return translate()
			}
		}
	}
}
