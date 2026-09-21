import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
	changePeriodKind,
	currentPeriod,
	formatPeriod,
	parsePeriod,
	periodRange
} from './stats-period'

describe('periodRange', () => {
	it('spans a whole month, including a leap February', () => {
		expect(periodRange({ kind: 'month', year: 2026, index: 3 })).toEqual({
			from: '2026-03-01',
			to: '2026-03-31'
		})
		expect(periodRange({ kind: 'month', year: 2028, index: 2 })).toEqual({
			from: '2028-02-01',
			to: '2028-02-29'
		})
	})

	it('spans a quarter of three months', () => {
		expect(periodRange({ kind: 'quarter', year: 2026, index: 4 })).toEqual({
			from: '2026-10-01',
			to: '2026-12-31'
		})
	})

	it('spans a whole year', () => {
		expect(periodRange({ kind: 'year', year: 2026, index: 1 })).toEqual({
			from: '2026-01-01',
			to: '2026-12-31'
		})
	})
})

describe('currentPeriod', () => {
	it('is the month, quarter or year containing today', () => {
		const today = dayjs('2026-08-15')

		expect(currentPeriod('month', today)).toEqual({
			kind: 'month',
			year: 2026,
			index: 8
		})
		expect(currentPeriod('quarter', today).index).toBe(3)
		expect(currentPeriod('year', today).year).toBe(2026)
	})
})

describe('changePeriodKind', () => {
	it('lands on the quarter containing the chosen month', () => {
		expect(
			changePeriodKind({ kind: 'month', year: 2026, index: 8 }, 'quarter')
		).toEqual({ kind: 'quarter', year: 2026, index: 3 })
	})

	it('lands on the first month of the chosen quarter', () => {
		expect(
			changePeriodKind({ kind: 'quarter', year: 2026, index: 3 }, 'month')
		).toEqual({ kind: 'month', year: 2026, index: 7 })
	})

	it('keeps the year when going to a year', () => {
		expect(
			changePeriodKind({ kind: 'month', year: 2025, index: 2 }, 'year')
				.year
		).toBe(2025)
	})
})

describe('formatPeriod / parsePeriod', () => {
	const periods = [
		{ kind: 'month', year: 2026, index: 9 },
		{ kind: 'month', year: 2026, index: 12 },
		{ kind: 'quarter', year: 2026, index: 3 },
		{ kind: 'year', year: 2026, index: 1 }
	] as const

	it('writes a month, quarter and year the way a link carries them', () => {
		expect(periods.map(formatPeriod)).toEqual([
			'2026-09',
			'2026-12',
			'2026-Q3',
			'2026-Y'
		])
	})

	it('reads back exactly what was written', () => {
		for (const period of periods) {
			expect(parsePeriod(formatPeriod(period))).toEqual(period)
		}
	})

	it('accepts a lowercase quarter marker typed by hand', () => {
		expect(parsePeriod('2026-q2')).toEqual({
			kind: 'quarter',
			year: 2026,
			index: 2
		})
	})

	it('reads a bare year, which the router delivers as a number', () => {
		const year = { kind: 'year', year: 2026, index: 1 }

		expect(parsePeriod('2026')).toEqual(year)
		expect(parsePeriod(2026)).toEqual(year)
		expect(parsePeriod('2026-y')).toEqual(year)
	})

	it('rejects values that are not a real period', () => {
		for (const raw of [
			undefined,
			'',
			'abc',
			'2026-13',
			'2026-00',
			'2026-Q5',
			'2026-Q0',
			'2026-9',
			'26-09',
			'2026-09-01',
			'0000',
			'3000'
		]) {
			expect(parsePeriod(raw)).toBeUndefined()
		}
	})
})
