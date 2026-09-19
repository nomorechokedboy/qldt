import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { buildUnitOptions, type UnitOptionSource } from '@/lib/unit-options'
import UnitSelect from './select'

// Radix Select leans on browser APIs jsdom does not implement.
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
})

const unit = (
	id: number,
	name: string,
	level: string,
	parent: { id: number; name: string } | null = null
): UnitOptionSource => ({ id, name, level, parent })

const d1 = unit(1, 'Tieu doan 1', 'battalion')
const c1 = unit(2, 'Dai doi 1', 'company', d1)
const c2 = unit(3, 'Dai doi 2', 'company', d1)
const options = buildUnitOptions([
	unit(4, 'Ban chi huy', 'platoon', c1),
	unit(5, 'Ban chi huy', 'platoon', c2),
	c1,
	c2,
	d1
])

function Harness({
	onChange,
	noneOption
}: {
	onChange: (v: string) => void
	noneOption?: { value: string; label: string }
}) {
	const [value, setValue] = useState<string | undefined>(undefined)

	return (
		<UnitSelect
			options={options}
			value={value}
			noneOption={noneOption}
			onValueChange={(v) => {
				setValue(v)
				onChange(v)
			}}
		/>
	)
}

const open = () =>
	fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

describe('UnitSelect', () => {
	it('shows the placeholder until a unit is chosen', () => {
		render(<Harness onChange={vi.fn()} />)

		expect(screen.getByRole('combobox').textContent).toContain(
			'Chọn đơn vị'
		)
	})

	it('offers every unit, grouped under its level heading', async () => {
		render(<Harness onChange={vi.fn()} />)
		open()

		const listbox = await screen.findByRole('listbox')
		for (const heading of ['Tiểu đoàn', 'Đại đội', 'Trung đội']) {
			expect(within(listbox).queryByText(heading)).not.toBeNull()
		}
		expect(within(listbox).getAllByRole('option')).toHaveLength(5)
	})

	it('lets the user tell same-named units apart', async () => {
		render(<Harness onChange={vi.fn()} />)
		open()

		const listbox = await screen.findByRole('listbox')
		const platoons = within(listbox)
			.getAllByRole('option')
			.map((o) => o.textContent ?? '')
			.filter((t) => t.startsWith('Ban chi huy'))
		expect(new Set(platoons).size).toBe(2)
	})

	it('reports the id of the chosen unit', async () => {
		const onChange = vi.fn()
		render(<Harness onChange={onChange} />)
		open()

		fireEvent.click(
			await screen.findByRole('option', { name: /^Dai doi 2/ })
		)

		expect(onChange).toHaveBeenCalledWith('3')
		expect(screen.getByRole('combobox').textContent).toContain('Dai doi 2')
	})

	it('offers the extra "none" entry when asked to', async () => {
		const onChange = vi.fn()
		render(
			<Harness
				onChange={onChange}
				noneOption={{ value: 'none', label: 'Không có (đơn vị gốc)' }}
			/>
		)
		open()

		fireEvent.click(
			await screen.findByRole('option', { name: 'Không có (đơn vị gốc)' })
		)

		expect(onChange).toHaveBeenCalledWith('none')
	})

	it('has no "none" entry by default', async () => {
		render(<Harness onChange={vi.fn()} />)
		open()

		await screen.findByRole('listbox')
		expect(screen.queryByRole('option', { name: /Không có/ })).toBeNull()
	})
})
