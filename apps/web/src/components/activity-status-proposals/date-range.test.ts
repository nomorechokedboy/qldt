import { describe, expect, it } from 'vitest'
import { fromDateRange, isRangedTarget, toDateRange } from './date-range'

describe('isRangedTarget', () => {
	it('treats a discharge as a single date, and every other status as a range', () => {
		expect(isRangedTarget('discharged')).toBe(false)
		expect(isRangedTarget('annual_leave')).toBe(true)
	})

	it('is not ranged before a status is picked', () => {
		expect(isRangedTarget('')).toBe(false)
	})
})

describe('toDateRange / fromDateRange', () => {
	it('round-trips a YYYY-MM-DD range', () => {
		const range = toDateRange('2026-09-01', '2026-09-30')

		expect(fromDateRange(range)).toEqual({
			startDate: '2026-09-01',
			endDate: '2026-09-30'
		})
	})

	it('keeps a half-picked range', () => {
		expect(fromDateRange(toDateRange('2026-09-01', undefined))).toEqual({
			startDate: '2026-09-01',
			endDate: undefined
		})
	})

	it('has no range when neither date is set or valid', () => {
		expect(toDateRange(undefined, undefined)).toBeUndefined()
		expect(toDateRange('not a date', 'also not')).toBeUndefined()
	})

	it('reads an undefined picker value as no dates', () => {
		expect(fromDateRange(undefined)).toEqual({
			startDate: undefined,
			endDate: undefined
		})
	})
})
