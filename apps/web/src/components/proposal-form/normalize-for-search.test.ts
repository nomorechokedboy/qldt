import { describe, expect, it } from 'vitest'
import normalizeForSearch from './normalize-for-search'

describe('normalizeForSearch', () => {
	it('lets an unaccented query match an accented Vietnamese name', () => {
		expect(normalizeForSearch('Nguyễn Văn Đạt')).toContain(
			normalizeForSearch('nguyen van dat')
		)
	})

	it('ignores case', () => {
		expect(normalizeForSearch('TRẦN')).toBe(normalizeForSearch('trần'))
	})

	it('folds đ into d', () => {
		expect(normalizeForSearch('Đặng')).toBe('dang')
	})

	it('leaves plain text alone', () => {
		expect(normalizeForSearch('abc 123')).toBe('abc 123')
	})
})
