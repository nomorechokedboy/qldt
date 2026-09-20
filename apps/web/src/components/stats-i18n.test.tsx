import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import DateRangePicker from './date-range-picker'
import { getMonthOptions, getQuarterOptions } from './period-options'
import { politicalOrgNameMapping } from './politics-quality-report/charts-section'
import i18n from '@/i18n'

afterEach(() => act(() => i18n.changeLanguage('vi')))

describe('stats language', () => {
	it('words the period options and date range placeholder in Vietnamese by default', () => {
		render(<DateRangePicker value={undefined} onChange={() => {}} />)

		expect(screen.getByText('Chọn khoảng ngày')).toBeTruthy()
		expect(getMonthOptions()[8]).toEqual({ value: '09', label: 'Tháng 9' })
		expect(getQuarterOptions()[0]).toEqual({ value: 'Q1', label: 'Quý 1' })
		expect(politicalOrgNameMapping.cpv).toBe('Đảng')
	})

	it('switches to English when the language changes', async () => {
		render(<DateRangePicker value={undefined} onChange={() => {}} />)

		await act(() => i18n.changeLanguage('en'))

		expect(screen.getByText('Select a date range')).toBeTruthy()
		expect(getMonthOptions()[8]).toEqual({ value: '09', label: 'Month 9' })
		expect(getQuarterOptions()[0]).toEqual({
			value: 'Q1',
			label: 'Quarter 1'
		})
		expect(politicalOrgNameMapping.hcyu).toBe('Youth Union')
	})
})
