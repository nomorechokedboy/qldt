import { useTranslation } from 'react-i18next'

// Static entries carry an i18n key ('nav:...') as their title; titles built
// from data (unit names) are shown as they are.
export function useNavLabel() {
	const { t } = useTranslation()
	return (title: string) =>
		title.startsWith('nav:') ? t(title as never) : title
}
