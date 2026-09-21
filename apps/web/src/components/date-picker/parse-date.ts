import i18n from '@/i18n'

export function formatDate(date: Date | undefined) {
	if (!date) {
		return ''
	}

	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear().toString()

	return `${day}/${month}/${year}`
}

// A Date only when day/month/year are a real calendar date, so 31/02/2023
// is rejected instead of rolling over into March.
function realDate(year: number, month: number, day: number) {
	const date = new Date(year, month, day)
	const isReal =
		date.getFullYear() === year &&
		date.getMonth() === month &&
		date.getDate() === day
	return isReal ? date : undefined
}

export function parseDate(dateString: string): Date | undefined {
	if (!dateString) return undefined

	const fourDigitYear = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
	if (fourDigitYear) {
		const [, day, month, year] = fourDigitYear.map(Number)
		const date = realDate(year, month - 1, day)
		if (date) return date
	}

	// dd/mm/yy, for backward compatibility: 00-30 mean 20xx, 31-99 mean 19xx.
	const twoDigitYear = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
	if (twoDigitYear) {
		const [, day, month, shortYear] = twoDigitYear.map(Number)
		const year = shortYear + (shortYear <= 30 ? 2000 : 1900)
		const date = realDate(year, month - 1, day)
		if (date) return date
	}

	// Anything else the standard parser understands (e.g. ISO dates).
	const date = new Date(dateString)
	return Number.isNaN(date.getTime()) ? undefined : date
}

// The error to show for a date the user typed, or null when it is complete
// (dd/mm/yyyy) and real. An empty field is not this check's business: whether
// a date is required is up to the form, so optional dates stay quiet.
export function validateDateFormat(
	value: string,
	label: string
): string | null {
	if (value === '') return null
	if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
		return i18n.t('stats:datePicker.formatHint', { label })
	}
	if (!parseDate(value)) {
		return i18n.t('stats:datePicker.invalid')
	}
	return null
}
