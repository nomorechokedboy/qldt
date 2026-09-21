import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import WeaponsOverview from './weapons-overview'

const summary = {
	byType: [
		{
			materialTypeId: 1,
			materialTypeName: 'AK-47',
			total: 10,
			inService: 6,
			damaged: 2,
			lost: 1,
			retired: 1,
			assigned: 4,
			heldByUnit: 6
		}
	],
	byUnit: [
		{
			unitId: 5,
			unitName: 'Đại đội 1',
			total: 7,
			inService: 4,
			assigned: 3,
			heldByUnit: 4
		},
		{
			unitId: 1,
			unitName: 'Tiểu đoàn 1',
			total: 3,
			inService: 2,
			assigned: 1,
			heldByUnit: 2
		}
	]
}

describe('WeaponsOverview', () => {
	it('breaks a weapon type down by status and allocation', () => {
		render(<WeaponsOverview summary={summary} unitId={1} />)

		const row = screen.getByRole('row', { name: /AK-47/ })
		expect(
			within(row)
				.getAllByRole('cell')
				.map((c) => c.textContent)
		).toEqual(['AK-47', '10', '6', '2', '1', '1', '4', '6'])
	})

	it('shows the pieces held by the unit next to those with troopers, per sub-unit', () => {
		render(<WeaponsOverview summary={summary} unitId={1} />)

		const row = screen.getByRole('row', { name: /Đại đội 1/ })
		expect(
			within(row)
				.getAllByRole('cell')
				.map((c) => c.textContent)
		).toEqual(['Đại đội 1', '7', '4', '3', '4'])
	})

	it('marks what the selected unit holds itself apart from its sub-units', () => {
		render(<WeaponsOverview summary={summary} unitId={1} />)

		expect(screen.getByText('Tiểu đoàn 1 (trực tiếp)')).toBeTruthy()
		expect(screen.getByText('Đại đội 1')).toBeTruthy()
	})

	it('says so when there are no weapons', () => {
		render(
			<WeaponsOverview summary={{ byType: [], byUnit: [] }} unitId={1} />
		)

		expect(screen.getByText('Chưa có vũ khí/trang bị nào.')).toBeTruthy()
	})
})
