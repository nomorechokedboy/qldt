import { describe, expect, it } from 'vitest'
import locationsRepo from './repo'

describe('locationsRepo.findProvinces', () => {
	it('returns all 34 provinces', () => {
		expect(locationsRepo.findProvinces()).toHaveLength(34)
	})

	it('normalizes a known province', () => {
		const hanoi = locationsRepo.findProvinces().find((p) => p.code === '11')

		expect(hanoi).toEqual({
			code: '11',
			name: 'Hà Nội',
			slug: 'ha-noi',
			type: 'thanh-pho',
			nameWithType: 'Thành phố Hà Nội'
		})
	})
})

describe('locationsRepo.findWards', () => {
	it('returns all 3321 wards when no provinceCode is given', () => {
		expect(locationsRepo.findWards({})).toHaveLength(3321)
	})

	it('filters wards by provinceCode', () => {
		const wards = locationsRepo.findWards({ provinceCode: '11' })

		expect(wards.length).toBeGreaterThan(0)
		expect(wards.every((w) => w.provinceCode === '11')).toBe(true)
	})

	it('normalizes a known ward', () => {
		const wards = locationsRepo.findWards({ provinceCode: '11' })
		const minhChau = wards.find((w) => w.code === '267')

		expect(minhChau).toEqual({
			code: '267',
			name: 'Minh Châu',
			slug: 'minh-chau',
			type: 'xa',
			nameWithType: 'Xã Minh Châu',
			path: 'Minh Châu, Hà Nội',
			pathWithType: 'Xã Minh Châu, Thành phố Hà Nội',
			provinceCode: '11'
		})
	})

	it('returns an empty list for an unknown provinceCode', () => {
		expect(locationsRepo.findWards({ provinceCode: 'unknown' })).toEqual([])
	})
})
