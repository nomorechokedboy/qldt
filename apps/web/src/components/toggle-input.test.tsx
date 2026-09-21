import dayjs from 'dayjs'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ToggleInput from './toggle-input'

// Radix Select/Popover and cmdk lean on browser APIs jsdom does not have.
beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	)
})

afterEach(() => {
	vi.unstubAllGlobals()
})

const options = [
	{ value: 'a', label: 'Alpha', group: 'Greek' },
	{ value: 'b', label: 'Beta', group: 'Greek' },
	{ value: 'x', label: 'Xray', group: 'NATO' },
	{ value: 'z', label: 'Zulu' }
]

function startEditing(text: string | RegExp) {
	fireEvent.doubleClick(screen.getByText(text))
}

// Days are grid cells; the clickable part is the button inside one.
async function pickDay(dayOfMonth: number) {
	const cells = await screen.findAllByRole('gridcell')
	const cell = cells.find((c) => c.textContent === String(dayOfMonth))
	if (!cell) throw new Error(`no day ${dayOfMonth}`)
	fireEvent.click(cell.querySelector('button') ?? cell)
}

const saveButton = (root: HTMLElement) =>
	root.querySelector('button.text-green-600') as HTMLElement
const cancelButton = (root: HTMLElement) =>
	root.querySelector('button.text-destructive') as HTMLElement

describe('ToggleInput display', () => {
	it('shows the initial text, or the default placeholder when empty', () => {
		const { rerender } = render(
			<ToggleInput type='text' initialValue='hi' />
		)
		expect(screen.getByText('hi')).toBeTruthy()

		rerender(<ToggleInput type='text' />)
		expect(screen.getByText('Nhấn để chỉnh sửa...')).toBeTruthy()

		rerender(<ToggleInput type='text' placeholder='Tên' />)
		expect(screen.getByText('Tên')).toBeTruthy()
	})

	it('follows initialValue when it changes', () => {
		const { rerender } = render(
			<ToggleInput type='text' initialValue='one' />
		)

		rerender(<ToggleInput type='text' initialValue='two' />)

		expect(screen.getByText('two')).toBeTruthy()
		expect(screen.queryByText('one')).toBeNull()
	})

	it('formats a date and falls back to the placeholder without one', () => {
		const { rerender } = render(
			<ToggleInput
				type='date'
				initialValue={new Date(2024, 2, 10)}
				dateFormat='DD/MM/YYYY'
			/>
		)
		expect(screen.getByText('10/03/2024')).toBeTruthy()

		rerender(
			<ToggleInput type='date' initialValue={null} placeholder='Ngày' />
		)
		expect(screen.getByText('Ngày')).toBeTruthy()
	})

	it('shows the label of the selected option, or the raw value when unknown', () => {
		const { rerender } = render(
			<ToggleInput type='select' initialValue='b' options={options} />
		)
		expect(screen.getByText('Beta')).toBeTruthy()

		rerender(
			<ToggleInput type='combobox' initialValue='x' options={options} />
		)
		expect(screen.getByText('Xray')).toBeTruthy()

		rerender(
			<ToggleInput type='combobox' initialValue='???' options={options} />
		)
		expect(screen.getByText('???')).toBeTruthy()
	})

	it('offers editing only when it is allowed', () => {
		const { container, rerender } = render(
			<ToggleInput type='text' initialValue='hi' />
		)
		expect(
			container.querySelector('.lucide-pen-line, .lucide-edit-3')
		).toBeTruthy()

		for (const flag of [
			{ disabled: true },
			{ readOnly: true },
			{ isLoading: true }
		]) {
			rerender(<ToggleInput type='text' initialValue='hi' {...flag} />)
			fireEvent.doubleClick(screen.getByText('hi'))
			expect(screen.queryByRole('textbox')).toBeNull()
			expect(
				container.querySelector('.lucide-pen-line, .lucide-edit-3')
			).toBeNull()
		}
	})

	it('shows a spinner while loading', () => {
		const { container } = render(
			<ToggleInput type='text' initialValue='hi' isLoading />
		)
		expect(container.querySelector('.animate-spin')).toBeTruthy()
	})
})

describe('ToggleInput text', () => {
	it('edits, reports each keystroke, and saves with the button', () => {
		const onChange = vi.fn()
		const onSave = vi.fn()
		const { container } = render(
			<ToggleInput
				type='text'
				initialValue='hi'
				onChange={onChange}
				onSave={onSave}
			/>
		)

		startEditing('hi')
		const input = screen.getByRole('textbox') as HTMLInputElement
		expect(document.activeElement).toBe(input)
		fireEvent.change(input, { target: { value: 'hello' } })

		expect(onChange).toHaveBeenCalledWith('hello')
		expect(onSave).not.toHaveBeenCalled()
		fireEvent.click(saveButton(container))

		expect(onSave).toHaveBeenCalledWith('hello')
		expect(screen.queryByRole('textbox')).toBeNull()
		expect(screen.getByText('hello')).toBeTruthy()
	})

	it('saves on Enter', () => {
		const onSave = vi.fn()
		render(<ToggleInput type='text' initialValue='hi' onSave={onSave} />)

		startEditing('hi')
		const input = screen.getByRole('textbox')
		fireEvent.change(input, { target: { value: 'yo' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		expect(onSave).toHaveBeenCalledWith('yo')
		expect(screen.getByText('yo')).toBeTruthy()
	})

	it('reverts on Escape and on the cancel button', () => {
		const onCancel = vi.fn()
		const onSave = vi.fn()
		const { container } = render(
			<ToggleInput
				type='text'
				initialValue='hi'
				onCancel={onCancel}
				onSave={onSave}
			/>
		)

		startEditing('hi')
		fireEvent.change(screen.getByRole('textbox'), {
			target: { value: 'nope' }
		})
		fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })
		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(screen.getByText('hi')).toBeTruthy()

		startEditing('hi')
		expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
			'hi'
		)
		fireEvent.change(screen.getByRole('textbox'), {
			target: { value: 'nope' }
		})
		fireEvent.click(cancelButton(container))
		expect(onCancel).toHaveBeenCalledTimes(2)
		expect(screen.getByText('hi')).toBeTruthy()
		expect(onSave).not.toHaveBeenCalled()
	})

	it('ignores keys and shows a spinner instead of buttons when loading mid-edit', () => {
		const onSave = vi.fn()
		const { container, rerender } = render(
			<ToggleInput type='text' initialValue='hi' onSave={onSave} />
		)
		startEditing('hi')

		rerender(
			<ToggleInput
				type='text'
				initialValue='hi'
				onSave={onSave}
				isLoading
			/>
		)

		expect(container.querySelector('.animate-spin')).toBeTruthy()
		expect(saveButton(container)).toBeNull()
		fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
		expect(onSave).not.toHaveBeenCalled()
		expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(
			true
		)
	})
})

describe('ToggleInput date', () => {
	it('picks a day, reports it, and saves it', async () => {
		const onChange = vi.fn()
		const onSave = vi.fn()
		const { container } = render(
			<ToggleInput
				type='date'
				initialValue={new Date(2024, 2, 10)}
				dateFormat='DD/MM/YYYY'
				onChange={onChange}
				onSave={onSave}
			/>
		)

		startEditing('10/03/2024')
		// Editing starts with the calendar open.
		await pickDay(15)

		// The calendar opens on the current month, not the selected one.
		const picked = onChange.mock.calls[0][0] as Date
		expect(picked.getDate()).toBe(15)
		const shown = dayjs(picked).format('DD/MM/YYYY')
		// The trigger now shows the pending value and the calendar closed.
		await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
		expect(screen.getByText(shown)).toBeTruthy()
		expect(onSave).not.toHaveBeenCalled()

		fireEvent.click(saveButton(container))
		expect(onSave.mock.calls[0][0]).toBe(picked)
		expect(screen.getByText(shown)).toBeTruthy()
	})

	it('discards the pending day on cancel', async () => {
		const onCancel = vi.fn()
		const { container } = render(
			<ToggleInput
				type='date'
				initialValue={new Date(2024, 2, 10)}
				dateFormat='DD/MM/YYYY'
				onCancel={onCancel}
			/>
		)

		startEditing('10/03/2024')
		await pickDay(15)

		await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
		fireEvent.click(cancelButton(container))

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(screen.getByText('10/03/2024')).toBeTruthy()
	})
})

describe('ToggleInput select', () => {
	it('lists grouped and ungrouped options, reports the pick, and saves it', async () => {
		const onChange = vi.fn()
		const onSave = vi.fn()
		const { container } = render(
			<ToggleInput
				type='select'
				initialValue='a'
				options={options}
				placeholder='Chọn'
				onChange={onChange}
				onSave={onSave}
			/>
		)

		startEditing('Alpha')
		fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })

		expect(await screen.findByText('Greek')).toBeTruthy()
		expect(screen.getByText('NATO')).toBeTruthy()
		expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
			['Alpha', 'Beta', 'Xray', 'Zulu']
		)

		fireEvent.click(screen.getByRole('option', { name: 'Xray' }))
		expect(onChange).toHaveBeenCalledWith('x')
		expect(onSave).not.toHaveBeenCalled()

		fireEvent.click(saveButton(container))
		expect(onSave).toHaveBeenCalledWith('x')
		expect(screen.getByText('Xray')).toBeTruthy()
	})

	it('shows the placeholder when nothing is selected', () => {
		render(
			<ToggleInput type='select' options={options} placeholder='Chọn' />
		)

		startEditing('Chọn')

		expect(screen.getByRole('combobox').textContent).toContain('Chọn')
	})
})

describe('ToggleInput combobox', () => {
	it('opens searchable grouped options, picks one, and saves it', async () => {
		const onChange = vi.fn()
		const onSave = vi.fn()
		const { container } = render(
			<ToggleInput
				type='combobox'
				initialValue='a'
				options={options}
				onChange={onChange}
				onSave={onSave}
			/>
		)

		startEditing('Alpha')

		expect(await screen.findByPlaceholderText('Tìm kiếm...')).toBeTruthy()
		expect(screen.getByText('Greek')).toBeTruthy()
		expect(screen.getByText('NATO')).toBeTruthy()
		expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
			['Alpha', 'Beta', 'Xray', 'Zulu']
		)

		fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
		expect(onChange).toHaveBeenCalledWith('b')
		await waitFor(() => expect(screen.queryByRole('option')).toBeNull())
		expect(screen.getByRole('combobox').textContent).toContain('Beta')

		fireEvent.click(saveButton(container))
		expect(onSave).toHaveBeenCalledWith('b')
		expect(screen.getByText('Beta')).toBeTruthy()
	})

	it('uses the custom search and empty texts', async () => {
		render(
			<ToggleInput
				type='combobox'
				initialValue='a'
				options={options}
				searchPlaceholder='Lọc'
				emptyMessage='Không có'
			/>
		)

		startEditing('Alpha')
		const search = await screen.findByPlaceholderText('Lọc')
		fireEvent.change(search, { target: { value: 'qqqq' } })

		expect(await screen.findByText('Không có')).toBeTruthy()
	})

	it('marks the current value and reverts on cancel', async () => {
		const onCancel = vi.fn()
		const { container } = render(
			<ToggleInput
				type='combobox'
				initialValue='a'
				options={options}
				onCancel={onCancel}
			/>
		)

		startEditing('Alpha')
		const alpha = await screen.findByRole('option', { name: 'Alpha' })
		expect(alpha.querySelector('.opacity-100')).toBeTruthy()
		expect(
			screen
				.getByRole('option', { name: 'Beta' })
				.querySelector('.opacity-100')
		).toBeNull()

		fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
		await waitFor(() => expect(screen.queryByRole('option')).toBeNull())
		fireEvent.click(cancelButton(container))

		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(screen.getByText('Alpha')).toBeTruthy()
	})
})
