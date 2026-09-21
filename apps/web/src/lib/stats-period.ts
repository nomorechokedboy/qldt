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

const MIN_YEAR = 1970
const MAX_YEAR = 2100

// The period as it travels in a URL: "2026-09" (month), "2026-Q3" (quarter)
// or "2026-Y" (year). One value, so it can never describe a combination that
// doesn't exist (a "year" with a month, a fifth quarter). The year carries a
// suffix because the router runs URL values through JSON.parse: a bare
// "2026" comes back as a number, and is written with quotes (%222026%22).
export function formatPeriod({ kind, year, index }: StatsPeriod): string {
	if (kind === 'month') return `${year}-${String(index).padStart(2, '0')}`
	if (kind === 'quarter') return `${year}-Q${index}`
	return `${year}-Y`
}

// Inverse of formatPeriod. Anything that isn't a real period (a typo in a
// shared link, month 13, year 0) is undefined, so callers can fall back to
// the current period rather than break. A bare year ("2026", which the
// router hands over as a number) is read as a whole year too.
export function parsePeriod(
	raw: string | number | undefined
): StatsPeriod | undefined {
	const match = String(raw ?? '').match(
		/^(\d{4})(?:-(?:(0[1-9]|1[0-2])|[Qq]([1-4])|[Yy]))?$/
	)
	if (!match) return undefined

	const year = Number(match[1])
	if (year < MIN_YEAR || year > MAX_YEAR) return undefined
	if (match[2]) return { kind: 'month', year, index: Number(match[2]) }
	if (match[3]) return { kind: 'quarter', year, index: Number(match[3]) }
	return { kind: 'year', year, index: 1 }
}
