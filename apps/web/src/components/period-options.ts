import i18n from '@/i18n'

export function getMonthOptions() {
	return Array.from({ length: 12 }, (_, index) => ({
		value: String(index + 1).padStart(2, '0'),
		label: i18n.t('stats:period.month', { month: index + 1 })
	}))
}

export function getQuarterOptions() {
	return [1, 2, 3, 4].map((quarter) => ({
		value: `Q${quarter}`,
		label: i18n.t('stats:period.quarter', { quarter })
	}))
}
