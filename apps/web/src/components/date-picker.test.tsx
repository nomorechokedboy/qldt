import dayjs from 'dayjs'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
	Harness,
	expectValue,
	installBrowserStubs,
	requiredWhenEmpty
} from '@/test/field-harness'
import DatePicker from './date-picker'

installBrowserStubs()

const LABEL = 'Ngày sinh'

function renderPicker(initial = '', validators?: Record<string, unknown>) {
	render(
		<Harness initial={initial} validators={validators}>
			<DatePicker label={LABEL} />
		</Harness>
	)
	return screen.getByLabelText(LABEL) as HTMLInputElement
}

// One keystroke: the browser hands the field its previous text plus the edit.
async function edit(input: HTMLInputElement, next: string, shown = next) {
	fireEvent.change(input, { target: { value: next } })
	await waitFor(() => expect(input.value).toBe(shown))
}

async function typeInto(input: HTMLInputElement, text: string) {
	for (const ch of text) {
		fireEvent.change(input, { target: { value: input.value + ch } })
		// let the form flush the masked value back into the input
		await new Promise((r) => setTimeout(r, 10))
	}
}

const caret = (input: HTMLInputElement) => waitFor(() => input.selectionStart)

const openCalendar = () =>
	fireEvent.click(screen.getByRole('button', { name: 'Select date' }))

async function pickDay(dayOfMonth: number) {
	const cells = await screen.findAllByRole('gridcell')
	const cell = cells.find((c) => c.textContent === String(dayOfMonth))
	if (!cell) throw new Error(`no day ${dayOfMonth}`)
	fireEvent.click(cell.querySelector('button') ?? cell)
}

describe('DatePicker display', () => {
	it('shows the label, the value, and a default placeholder', () => {
		const input = renderPicker('15/03/2024')
		expect(input.value).toBe('15/03/2024')
		expect(input.maxLength).toBe(10)

		const empty = render(
			<Harness initial=''>
				<DatePicker label='Khác' />
			</Harness>
		)
		expect(
			(empty.getByLabelText('Khác') as HTMLInputElement).placeholder
		).toBe('Ngày/tháng/năm')
	})

	it('uses a custom placeholder when given', () => {
		render(
			<Harness initial=''>
				<DatePicker label={LABEL} placeholder='dd/mm/yyyy' />
			</Harness>
		)
		expect(
			(screen.getByLabelText(LABEL) as HTMLInputElement).placeholder
		).toBe('dd/mm/yyyy')
	})
})

describe('DatePicker mask', () => {
	it('inserts slashes as segments complete and skips over them', async () => {
		const input = renderPicker()
		await typeInto(input, '1')
		expect(input.value).toBe('1')

		await typeInto(input, '2')
		expect(input.value).toBe('12/')
		expect(await caret(input)).toBe(3)

		await typeInto(input, '03')
		expect(input.value).toBe('12/03/')

		await typeInto(input, '1990')
		expect(input.value).toBe('12/03/1990')
		await expectValue('"12/03/1990"')
	})

	it('drops non-digits', async () => {
		const input = renderPicker()
		await edit(input, '1a', '1')
		await expectValue('"1"')
	})

	it('caps each segment (day 2, month 2, year 4 digits)', async () => {
		const input = renderPicker('12/03/1990')
		await edit(input, '12/03/19901', '12/03/1990')
	})

	it('backspacing over a slash deletes the digit before it', async () => {
		const input = renderPicker('12/')
		await edit(input, '12', '1')
		await expectValue('"1"')
	})

	it('backspacing over the second slash deletes the month digit', async () => {
		const input = renderPicker('12/03/')
		await edit(input, '12/03', '12/0')
		await expectValue('"12/0"')
	})

	it('deleting one digit does not reflow the other segments', async () => {
		const input = renderPicker('12/03/1990')
		// remove the "3" of the month
		await edit(input, '12/0/1990')
		await expectValue('"12/0/1990"')
	})

	it('typing over a selection replaces just that segment', async () => {
		const input = renderPicker('12/03/1990')
		// select "03", type "11"
		await edit(input, '12/11/1990')
		await expectValue('"12/11/1990"')
	})

	it('select-all + delete clears everything', async () => {
		const input = renderPicker('12/03/1990')
		await edit(input, '')
		await expectValue('""')
	})

	it('caps a multi-digit edit to the segment it lands in', async () => {
		const input = renderPicker()
		await edit(input, '25121990', '25/')
		await expectValue('"25/"')
	})
})

function paste(input: HTMLInputElement, text: string) {
	fireEvent.paste(input, { clipboardData: { getData: () => text } })
}

describe('DatePicker paste', () => {
	it.each([
		['25/12/1990', '25/12/1990'],
		['25-12-1990', '25/12/1990'],
		['25.12.1990', '25/12/1990'],
		['5/2/1990', '05/02/1990'],
		['25121990', '25/12/1990'],
		['1990-12-25', '25/12/1990'],
		['  25/12/1990\n', '25/12/1990']
	])('fills the whole date from %j', async (text, expected) => {
		const input = renderPicker()
		paste(input, text)
		await waitFor(() => expect(input.value).toBe(expected))
		await expectValue(JSON.stringify(expected))
	})

	it('replaces whatever was there, and moves the calendar to that month', async () => {
		const input = renderPicker('01/01/2000')
		paste(input, '25/12/1990')
		await expectValue('"25/12/1990"')

		openCalendar()
		await pickDay(20)
		await expectValue('"20/12/1990"')
	})

	it('puts the caret after the pasted date', async () => {
		const input = renderPicker()
		paste(input, '25/12/1990')
		expect(await caret(input)).toBe(10)
	})

	it('clears a validation error the way typing does', async () => {
		const input = renderPicker('31/02/2023')
		fireEvent.blur(input)
		expect(
			await screen.findByText('Vui lòng nhập một ngày hợp lệ')
		).toBeTruthy()

		paste(input, '25/12/1990')
		await waitFor(() =>
			expect(
				screen.queryByText('Vui lòng nhập một ngày hợp lệ')
			).toBeNull()
		)
	})

	it('leaves other pasted text to the normal masking', async () => {
		const input = renderPicker()
		// not swallowed: the browser's own paste still runs, and the mask
		// then handles the text it inserts
		const notPrevented = fireEvent.paste(input, {
			clipboardData: { getData: () => 'hello' }
		})
		expect(notPrevented).toBe(true)
	})

	it('still lets an impossible pasted date be caught on blur', async () => {
		const input = renderPicker()
		paste(input, '31/02/2023')
		await expectValue('"31/02/2023"')
		fireEvent.blur(input)
		expect(
			await screen.findByText('Vui lòng nhập một ngày hợp lệ')
		).toBeTruthy()
	})
})

describe('DatePicker validation', () => {
	const messageFor = {
		format: `Hãy nhập ${LABEL} theo định dạng dd/mm/yyyy`,
		invalid: 'Vui lòng nhập một ngày hợp lệ'
	}

	it('accepts a complete real date on blur', async () => {
		const input = renderPicker('29/02/2024')
		fireEvent.blur(input)
		await new Promise((r) => setTimeout(r, 20))
		expect(screen.queryByText(messageFor.format)).toBeNull()
		expect(screen.queryByText(messageFor.invalid)).toBeNull()
	})

	it('asks for the full format when incomplete or empty', async () => {
		const input = renderPicker('1/2/1990')
		fireEvent.blur(input)
		expect(await screen.findByText(messageFor.format)).toBeTruthy()
	})

	it('says nothing about an empty field, so optional dates stay quiet', async () => {
		const input = renderPicker('')
		fireEvent.blur(input)
		await new Promise((r) => setTimeout(r, 20))
		expect(screen.queryByText(messageFor.format)).toBeNull()
		expect(screen.queryByText(messageFor.invalid)).toBeNull()
	})

	it('still asks for the full format on a partly typed date', async () => {
		const input = renderPicker('12/03')
		fireEvent.blur(input)
		expect(await screen.findByText(messageFor.format)).toBeTruthy()
	})

	it('rejects a complete but impossible date', async () => {
		const input = renderPicker('31/02/2023')
		fireEvent.blur(input)
		expect(await screen.findByText(messageFor.invalid)).toBeTruthy()
	})

	it('hides its error until touched, and typing clears it', async () => {
		const input = renderPicker('31/02/2023')
		expect(screen.queryByText(messageFor.invalid)).toBeNull()

		fireEvent.blur(input)
		expect(await screen.findByText(messageFor.invalid)).toBeTruthy()

		await edit(input, '31/02/202', '31/02/202')
		await waitFor(() =>
			expect(screen.queryByText(messageFor.invalid)).toBeNull()
		)
	})

	it('shows the form validator error, e.g. for a required empty date', async () => {
		const input = renderPicker('', requiredWhenEmpty)
		fireEvent.blur(input)
		expect(await screen.findByText('Required')).toBeTruthy()
	})

	it('shows the form error alongside the format hint for a partly typed date', async () => {
		const input = renderPicker('12/03', { onMount: () => 'Too vague' })
		fireEvent.blur(input)
		expect(await screen.findByText('Too vague')).toBeTruthy()
		expect(await screen.findByText(messageFor.format)).toBeTruthy()
	})
})

describe('DatePicker calendar', () => {
	it('opens from the button and from ArrowDown', async () => {
		const input = renderPicker('15/03/2024')
		openCalendar()
		expect(await screen.findByRole('grid')).toBeTruthy()

		// close, then reopen with the keyboard
		fireEvent.keyDown(document.activeElement ?? document.body, {
			key: 'Escape'
		})
		await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())

		fireEvent.keyDown(input, { key: 'ArrowDown' })
		expect(await screen.findByRole('grid')).toBeTruthy()
	})

	it('shows the month of the current value and picks a day into dd/mm/yyyy', async () => {
		renderPicker('15/03/2024')
		openCalendar()
		await pickDay(20)

		await expectValue('"20/03/2024"')
		await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())
	})

	it('reads two-digit years (00-30 are 20xx, 31-99 are 19xx)', async () => {
		renderPicker('15/3/24')
		openCalendar()
		await pickDay(20)
		await expectValue('"20/03/2024"')
	})

	it('reads two-digit 19xx years', async () => {
		renderPicker('15/03/95')
		openCalendar()
		await pickDay(20)
		await expectValue('"20/03/1995"')
	})

	it('reads ISO dates through the standard-parser fallback', async () => {
		renderPicker('2024-03-15')
		openCalendar()
		await pickDay(20)
		await expectValue('"20/03/2024"')
	})

	it('opens on the current month when the value is not a date', async () => {
		renderPicker('31/02/2023')
		openCalendar()
		await pickDay(10)
		const expected = dayjs().date(10).format('DD/MM/YYYY')
		await expectValue(JSON.stringify(expected))
	})

	it('picking a day clears a previous validation error', async () => {
		const input = renderPicker('31/02/2023')
		fireEvent.blur(input)
		expect(
			await screen.findByText('Vui lòng nhập một ngày hợp lệ')
		).toBeTruthy()

		openCalendar()
		await pickDay(10)
		await waitFor(() =>
			expect(
				screen.queryByText('Vui lòng nhập một ngày hợp lệ')
			).toBeNull()
		)
	})

	it('follows the typed date to its month', async () => {
		const input = renderPicker('15/03/2024')
		await edit(input, '15/03/20245', '15/03/2024') // no change to value
		await edit(input, '15/04/2024')
		openCalendar()
		await pickDay(20)
		await expectValue('"20/04/2024"')
	})
})
