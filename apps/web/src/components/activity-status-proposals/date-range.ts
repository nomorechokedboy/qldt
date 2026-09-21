import dayjs from 'dayjs'
import type { DateRange } from 'react-day-picker'

// The picker speaks Date/DateRange; proposal dates are stored and sent as
// "YYYY-MM-DD" strings, so every read/write goes through these two helpers.
export function toDateRange(
	start: string | undefined,
	end: string | undefined
): DateRange | undefined {
	const from = start ? dayjs(start, 'YYYY-MM-DD') : undefined
	const to = end ? dayjs(end, 'YYYY-MM-DD') : undefined
	if (!from?.isValid() && !to?.isValid()) return undefined
	return {
		from: from?.isValid() ? from.toDate() : undefined,
		to: to?.isValid() ? to.toDate() : undefined
	}
}

export function fromDateRange(range: DateRange | undefined): {
	startDate: string | undefined
	endDate: string | undefined
} {
	return {
		startDate: range?.from
			? dayjs(range.from).format('YYYY-MM-DD')
			: undefined,
		endDate: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : undefined
	}
}

// 'discharged' is a one-off transition (single effectiveDate); the other 3
// target statuses are ranged (startDate -> endDate). Mirrors
// isRangedTargetActivityStatus on the backend.
export const isRangedTarget = (target: string) =>
	target !== '' && target !== 'discharged'
