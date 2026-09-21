import dayjs from 'dayjs'

export type PeriodKind = 'month' | 'quarter' | 'year'

export interface StatsPeriod {
	kind: PeriodKind
	year: number
	// 1-12 for a month, 1-4 for a quarter, ignored for a year.
	index: number
}

// Inclusive "YYYY-MM-DD" bounds of the period, as the stats API expects.
export function periodRange({ kind, year, index }: StatsPeriod) {
	const start =
		kind === 'month'
			? dayjs(new Date(year, index - 1, 1))
			: kind === 'quarter'
				? dayjs(new Date(year, (index - 1) * 3, 1))
				: dayjs(new Date(year, 0, 1))
	const end = start
		.add(kind === 'month' ? 1 : kind === 'quarter' ? 3 : 12, 'month')
		.subtract(1, 'day')

	return { from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD') }
}

// The period that contains today, for a chosen kind.
export function currentPeriod(kind: PeriodKind, today = dayjs()): StatsPeriod {
	return {
		kind,
		year: today.year(),
		index:
			kind === 'month'
				? today.month() + 1
				: kind === 'quarter'
					? Math.floor(today.month() / 3) + 1
					: 1
	}
}

// Switching kind keeps the year and lands on the period of that kind that
// contains the current one (the quarter of the chosen month, and so on).
export function changePeriodKind(
	period: StatsPeriod,
	kind: PeriodKind
): StatsPeriod {
	if (kind === period.kind) return period
	const firstMonth =
		period.kind === 'month'
			? period.index
			: period.kind === 'quarter'
				? (period.index - 1) * 3 + 1
				: 1
	const index =
		kind === 'month'
			? firstMonth
			: kind === 'quarter'
				? Math.floor((firstMonth - 1) / 3) + 1
				: 1

	return { kind, year: period.year, index }
}
