import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { cloneElement, type ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppForm } from '@/hooks/use-app-form'
import {
	AvatarField,
	Combobox,
	EditableInput,
	ErrorMessages,
	Select,
	Slider,
	Switch,
	TextArea,
	TextField,
	UploadField
} from './form-components'

// Radix Select/Popover/Slider and cmdk lean on browser APIs jsdom does not have.
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
	// jsdom has no blob URLs; AvatarUpload previews the chosen file with one.
	URL.createObjectURL = vi.fn(() => 'blob:preview')
	URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

function show(value: unknown) {
	if (value instanceof File) return `file:${value.name}`
	if (value === null) return 'null'
	return JSON.stringify(value)
}

// The field's children are re-created on every render (as in the app's
// `children={(field) => <field.X />}`); a static element would never re-render.
// One real form with a single `value` field, rendered through the same
// `useAppForm` the app uses. The `value` readout is the form's own state.
function Harness({
	initial,
	validators,
	onSubmit,
	children
}: {
	initial: unknown
	validators?: Record<string, unknown>
	onSubmit?: () => Promise<void> | void
	children: ReactElement
}) {
	const form = useAppForm({
		defaultValues: { value: initial },
		onSubmit: async () => {
			await onSubmit?.()
		}
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				form.handleSubmit()
			}}
		>
			<form.AppField name='value' validators={validators as never}>
				{() => cloneElement(children)}
			</form.AppField>
			<form.Subscribe selector={(s) => s.values.value}>
				{(v) => <output data-testid='value'>{show(v)}</output>}
			</form.Subscribe>
			<form.AppForm>
				<form.SubscribeButton label='Save' />
			</form.AppForm>
		</form>
	)
}

const formValue = () => screen.getByTestId('value').textContent
// TanStack Form flushes store updates asynchronously.
const expectValue = (expected: string) =>
	waitFor(() => expect(formValue()).toBe(expected))

const requiredWhenEmpty = {
	onMount: () => 'Required',
	onChange: ({ value }: { value: unknown }) =>
		value ? undefined : 'Required'
}

function fileOf(name: string, bytes: number) {
	return new File([new Uint8Array(bytes)], name, { type: 'text/plain' })
}

const fileInput = (root: HTMLElement) =>
	root.querySelector('input[type="file"]') as HTMLInputElement

function chooseFile(input: HTMLInputElement, files: File[]) {
	fireEvent.change(input, { target: { files } })
}

describe('ErrorMessages', () => {
	it('renders bare strings and { message } objects', async () => {
		render(
			<ErrorMessages errors={['Too short', { message: 'Bad chars' }]} />
		)
		expect(screen.getByText('Too short')).toBeTruthy()
		expect(screen.getByText('Bad chars')).toBeTruthy()
	})

	it('renders nothing for an empty list', async () => {
		const { container } = render(<ErrorMessages errors={[]} />)
		expect(container.textContent).toBe('')
	})
})

describe('SubscribeButton', () => {
	it('is a submit button that is disabled while the form submits', async () => {
		let finish: () => void = () => {}
		render(
			<Harness
				initial=''
				onSubmit={() =>
					new Promise<void>((resolve) => {
						finish = resolve
					})
				}
			>
				<TextField label='Name' />
			</Harness>
		)

		const button = screen.getByRole('button', { name: 'Save' })
		expect(button.getAttribute('type')).toBe('submit')
		expect((button as HTMLButtonElement).disabled).toBe(false)

		fireEvent.click(button)
		await waitFor(() =>
			expect((button as HTMLButtonElement).disabled).toBe(true)
		)

		finish()
		await waitFor(() =>
			expect((button as HTMLButtonElement).disabled).toBe(false)
		)
	})
})

describe('TextField', () => {
	it('shows the label and value, and writes typing back to the form', async () => {
		render(
			<Harness initial='abc'>
				<TextField label='Name' placeholder='Your name' />
			</Harness>
		)

		const input = screen.getByLabelText('Name') as HTMLInputElement
		expect(input.value).toBe('abc')
		expect(input.placeholder).toBe('Your name')

		fireEvent.change(input, { target: { value: 'abcd' } })
		await expectValue('"abcd"')
		expect(input.value).toBe('abcd')
	})

	it('puts className on the wrapper, not the input', async () => {
		const { container } = render(
			<Harness initial=''>
				<TextField label='Name' className='wrapper-class' />
			</Harness>
		)
		expect(container.querySelector('.wrapper-class')).toBeTruthy()
		expect(screen.getByLabelText('Name').className).not.toContain(
			'wrapper-class'
		)
	})

	it('hides errors until the field is touched', async () => {
		render(
			<Harness initial='' validators={requiredWhenEmpty}>
				<TextField label='Name' />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())

		fireEvent.blur(screen.getByLabelText('Name'))
		expect(await screen.findByText('Required')).toBeTruthy()
	})

	it('clears the error once the value becomes valid', async () => {
		render(
			<Harness initial='' validators={requiredWhenEmpty}>
				<TextField label='Name' />
			</Harness>
		)
		const input = screen.getByLabelText('Name')
		fireEvent.blur(input)
		expect(await screen.findByText('Required')).toBeTruthy()

		fireEvent.change(input, { target: { value: 'x' } })
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())
	})

	it('masks the value for type=password and can reveal it', async () => {
		const { container } = render(
			<Harness initial='secret'>
				<TextField label='Password' type='password' />
			</Harness>
		)
		const input = container.querySelector('input') as HTMLInputElement
		expect(input.type).toBe('password')
		expect(input.value).toBe('secret')

		fireEvent.change(input, { target: { value: 'secret2' } })
		await expectValue('"secret2"')

		const reveal = container.querySelector('button[type="button"]')
		if (!reveal) throw new Error('no reveal button')
		fireEvent.click(reveal)
		expect(input.type).toBe('text')
	})
})

describe('TextArea', () => {
	it('honours rows (default 3) and writes changes to the form', async () => {
		const { rerender } = render(
			<Harness initial='hello'>
				<TextArea label='Notes' />
			</Harness>
		)
		const area = screen.getByLabelText('Notes') as HTMLTextAreaElement
		expect(area.rows).toBe(3)
		expect(area.value).toBe('hello')

		fireEvent.change(area, { target: { value: 'hello!' } })
		await expectValue('"hello!"')

		rerender(
			<Harness initial='hello'>
				<TextArea label='Notes' rows={6} />
			</Harness>
		)
		expect(
			(screen.getByLabelText('Notes') as HTMLTextAreaElement).rows
		).toBe(6)
	})

	it('shows errors only once touched', async () => {
		render(
			<Harness initial='' validators={requiredWhenEmpty}>
				<TextArea label='Notes' />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())
		fireEvent.blur(screen.getByLabelText('Notes'))
		expect(await screen.findByText('Required')).toBeTruthy()
	})
})

describe('Select', () => {
	const values = [
		{ label: 'Alpha', value: 'a', group: 'Greek' },
		{ label: 'Beta', value: 'b', group: 'Greek' },
		{ label: 'Zulu', value: 'z' }
	]

	function open() {
		fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
	}

	it('shows the placeholder, then the label of the chosen option', async () => {
		render(
			<Harness initial=''>
				<Select label='Letter' values={values} placeholder='Pick one' />
			</Harness>
		)
		expect(screen.getByText('Pick one')).toBeTruthy()

		open()
		fireEvent.click(screen.getByRole('option', { name: 'Beta' }))

		await expectValue('"b"')
		expect(screen.getByRole('combobox').textContent).toContain('Beta')
	})

	it('groups options, headed by the group name or the field label', async () => {
		render(
			<Harness initial=''>
				<Select label='Letter' values={values} />
			</Harness>
		)
		open()
		expect(screen.getByText('Greek')).toBeTruthy()
		// ungrouped options fall under the field's own label (also the <label>)
		expect(screen.getAllByText('Letter').length).toBe(2)
	})

	it('reports the chosen value to onChange', async () => {
		const onChange = vi.fn()
		render(
			<Harness initial=''>
				<Select label='Letter' values={values} onChange={onChange} />
			</Harness>
		)
		open()
		fireEvent.click(screen.getByRole('option', { name: 'Zulu' }))
		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith('z')
	})

	it('shows errors only once touched', async () => {
		render(
			<Harness initial='' validators={requiredWhenEmpty}>
				<Select label='Letter' values={values} />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())

		open()
		fireEvent.click(screen.getByRole('option', { name: 'Alpha' }))
		// chosen -> touched, and the value is valid so there is nothing to show
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())
	})
})

describe('Slider', () => {
	it('reflects the form value and writes keyboard changes back', async () => {
		render(
			<Harness initial={5}>
				<Slider label='Level' />
			</Harness>
		)
		const thumb = screen.getByRole('slider')
		expect(thumb.getAttribute('aria-valuenow')).toBe('5')

		fireEvent.keyDown(thumb, { key: 'ArrowRight' })
		await expectValue('6')
		expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe(
			'6'
		)
	})
})

describe('Switch', () => {
	it('toggles the boolean, from either the switch or its label', async () => {
		render(
			<Harness initial={false}>
				<Switch label='Active' />
			</Harness>
		)
		const toggle = screen.getByRole('switch', { name: 'Active' })
		expect(toggle.getAttribute('aria-checked')).toBe('false')

		fireEvent.click(toggle)
		await expectValue('true')
		expect(toggle.getAttribute('aria-checked')).toBe('true')

		fireEvent.click(screen.getByText('Active'))
		await expectValue('false')
	})
})

describe('Combobox', () => {
	const values = [
		{ label: 'Alpha', value: 'a' },
		{ label: 'Beta', value: 'b' },
		{ label: 'Gamma', value: 'g' }
	]

	const trigger = () => screen.getByRole('combobox')

	it('shows the placeholder (default or custom) until something is chosen', async () => {
		const { rerender } = render(
			<Harness initial=''>
				<Combobox label='Letter' values={values} />
			</Harness>
		)
		expect(trigger().textContent).toContain('Select option...')

		rerender(
			<Harness initial=''>
				<Combobox label='Letter' values={values} placeholder='Choose' />
			</Harness>
		)
		expect(trigger().textContent).toContain('Choose')
	})

	it('shows the label of the initial value', async () => {
		render(
			<Harness initial='g'>
				<Combobox label='Letter' values={values} />
			</Harness>
		)
		expect(trigger().textContent).toContain('Gamma')
	})

	it('picks an option, closes, and reports it to the form and onChange', async () => {
		const onChange = vi.fn()
		render(
			<Harness initial=''>
				<Combobox label='Letter' values={values} onChange={onChange} />
			</Harness>
		)
		expect(trigger().getAttribute('aria-expanded')).toBe('false')

		fireEvent.click(trigger())
		expect(trigger().getAttribute('aria-expanded')).toBe('true')
		fireEvent.click(screen.getByText('Beta'))

		await expectValue('"b"')
		expect(onChange).toHaveBeenCalledWith('b')
		expect(trigger().getAttribute('aria-expanded')).toBe('false')
		expect(trigger().textContent).toContain('Beta')
	})

	it('clears the value when the selected option is picked again', async () => {
		const onChange = vi.fn()
		render(
			<Harness initial='b'>
				<Combobox label='Letter' values={values} onChange={onChange} />
			</Harness>
		)
		fireEvent.click(trigger())
		fireEvent.click(screen.getByRole('option', { name: 'Beta' }))

		await expectValue('""')
		expect(onChange).toHaveBeenCalledWith('')
		expect(trigger().textContent).toContain('Select option...')
	})

	it('filters by label and says so when nothing matches', async () => {
		render(
			<Harness initial=''>
				<Combobox label='Letter' values={values} />
			</Harness>
		)
		fireEvent.click(trigger())

		// the search box is titled from the (lower-cased) field label
		const search = screen.getByPlaceholderText('Tìm letter...')
		fireEvent.change(search, { target: { value: 'gam' } })
		expect(screen.queryByText('Alpha')).toBeNull()
		expect(screen.getByText('Gamma')).toBeTruthy()

		fireEvent.change(search, { target: { value: 'zzz' } })
		expect(screen.getByText('No option found.')).toBeTruthy()
	})

	it('shows errors only once touched', async () => {
		render(
			<Harness initial='' validators={requiredWhenEmpty}>
				<Combobox label='Letter' values={values} />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())

		// pick then un-pick: value is empty again and the field is touched
		fireEvent.click(trigger())
		fireEvent.click(screen.getByText('Alpha'))
		fireEvent.click(trigger())
		fireEvent.click(screen.getByRole('option', { name: 'Alpha' }))
		expect(await screen.findByText('Required')).toBeTruthy()
	})
})

describe('EditableInput', () => {
	it('shows the value as text, not an input, until edited', async () => {
		render(
			<Harness initial='hello'>
				<EditableInput label='Title' />
			</Harness>
		)
		expect(screen.getByText('hello')).toBeTruthy()
		expect(screen.queryByRole('textbox')).toBeNull()
	})

	it('saves the edit into the form', async () => {
		render(
			<Harness initial='hello'>
				<EditableInput label='Title' />
			</Harness>
		)
		fireEvent.doubleClick(screen.getByText('hello'))
		const input = screen.getByRole('textbox')
		fireEvent.change(input, { target: { value: 'bye' } })
		fireEvent.keyDown(input, { key: 'Enter' })

		await expectValue('"bye"')
		expect(screen.getByText('bye')).toBeTruthy()
	})

	it('updates the form while typing, and keeps the old value on cancel', async () => {
		render(
			<Harness initial='hello'>
				<EditableInput label='Title' />
			</Harness>
		)
		fireEvent.doubleClick(screen.getByText('hello'))
		const input = screen.getByRole('textbox')
		fireEvent.change(input, { target: { value: 'bye' } })
		// change goes to the form immediately so validation errors clear
		await expectValue('"bye"')

		fireEvent.keyDown(input, { key: 'Escape' })
		expect(screen.queryByRole('textbox')).toBeNull()
	})

	it('shows errors only after the field is touched by saving or cancelling', async () => {
		render(
			<Harness initial='' validators={requiredWhenEmpty}>
				<EditableInput label='Title' />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())

		fireEvent.doubleClick(screen.getByText('Nhấn để chỉnh sửa...'))
		fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })
		expect(await screen.findByText('Required')).toBeTruthy()
	})

	it('puts className on the wrapper', async () => {
		const { container } = render(
			<Harness initial='x'>
				<EditableInput label='Title' className='wrapper-class' />
			</Harness>
		)
		expect(container.querySelector('.wrapper-class')).toBeTruthy()
	})
})

describe('UploadField', () => {
	it('shows the drag-and-drop copy (defaults, then overrides)', async () => {
		const { rerender } = render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		expect(screen.getByText('Choose file')).toBeTruthy()
		expect(screen.getByText('Drag & Drop a file here')).toBeTruthy()
		expect(screen.getByText('or click to browse files')).toBeTruthy()

		rerender(
			<Harness initial={null}>
				<UploadField
					label='CV'
					browseButtonText='Pick'
					dragDropText='Drop it'
					browseText='or click'
				/>
			</Harness>
		)
		expect(screen.getByText('Pick')).toBeTruthy()
		expect(screen.getByText('Drop it')).toBeTruthy()
		expect(screen.getByText('or click')).toBeTruthy()
	})

	it('can hide the browse button', async () => {
		render(
			<Harness initial={null}>
				<UploadField label='CV' showBrowseButton={false} />
			</Harness>
		)
		expect(screen.queryByText('Choose file')).toBeNull()
	})

	it('opens the file picker from the button and from the drop area', async () => {
		const { container } = render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		const click = vi.spyOn(fileInput(container), 'click')

		fireEvent.click(screen.getByText('Choose file'))
		expect(click).toHaveBeenCalledTimes(1)

		fireEvent.click(screen.getByText('Drag & Drop a file here'))
		expect(click).toHaveBeenCalledTimes(2)
	})

	it('passes accept through to the file input', async () => {
		const { container } = render(
			<Harness initial={null}>
				<UploadField label='CV' accept='.pdf' />
			</Harness>
		)
		expect(fileInput(container).accept).toBe('.pdf')
	})

	it('stores a chosen file, and null when the choice is cleared', async () => {
		const { container } = render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		chooseFile(fileInput(container), [fileOf('cv.pdf', 10)])
		await expectValue('file:cv.pdf')

		chooseFile(fileInput(container), [])
		await expectValue('null')
	})

	it('ignores a chosen file over the limit (10 MB by default)', async () => {
		const { container } = render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		chooseFile(fileInput(container), [
			fileOf('huge.bin', 10 * 1024 * 1024 + 1)
		])
		await expectValue('null')

		chooseFile(fileInput(container), [fileOf('edge.bin', 10 * 1024 * 1024)])
		await expectValue('file:edge.bin')
	})

	it('honours a custom maxSize', async () => {
		const { container } = render(
			<Harness initial={null}>
				<UploadField label='CV' maxSize={100} />
			</Harness>
		)
		chooseFile(fileInput(container), [fileOf('big.bin', 101)])
		await expectValue('null')
		chooseFile(fileInput(container), [fileOf('ok.bin', 100)])
		await expectValue('file:ok.bin')
	})

	it('stores the first dropped file and ignores an oversized one', async () => {
		render(
			<Harness initial={null}>
				<UploadField label='CV' maxSize={100} />
			</Harness>
		)
		const area = screen
			.getByText('Drag & Drop a file here')
			.closest('div[class*="cursor-pointer"]') as HTMLElement

		fireEvent.drop(area, {
			dataTransfer: { files: [fileOf('big.bin', 500)] }
		})
		await expectValue('null')

		fireEvent.drop(area, {
			dataTransfer: {
				files: [fileOf('first.bin', 10), fileOf('second.bin', 10)]
			}
		})
		await expectValue('file:first.bin')
	})

	it('does nothing when a drop carries no files', async () => {
		render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		const area = screen
			.getByText('Drag & Drop a file here')
			.closest('div[class*="cursor-pointer"]') as HTMLElement
		fireEvent.drop(area, { dataTransfer: { files: [] } })
		await expectValue('null')
	})

	it('highlights the drop area while a file is dragged over it', async () => {
		render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		const area = screen
			.getByText('Drag & Drop a file here')
			.closest('div[class*="cursor-pointer"]') as HTMLElement
		expect(area.classList.contains('bg-secondary')).toBe(false)

		fireEvent.dragOver(area)
		expect(area.classList.contains('bg-secondary')).toBe(true)

		fireEvent.dragLeave(area)
		expect(area.classList.contains('bg-secondary')).toBe(false)
	})

	it('lists the file passed as `value` with its size in MB', async () => {
		render(
			<Harness initial={null}>
				<UploadField
					label='CV'
					value={fileOf('cv.pdf', 1.5 * 1024 * 1024)}
				/>
			</Harness>
		)
		expect(screen.getByText('cv.pdf')).toBeTruthy()
		expect(screen.getByText('1.50 MB')).toBeTruthy()
	})

	it('has no file panel without a `value`', async () => {
		render(
			<Harness initial={null}>
				<UploadField label='CV' />
			</Harness>
		)
		expect(screen.queryByText(/MB$/)).toBeNull()
	})

	it('in small mode, prompts, then shows the chosen file name', async () => {
		const { container } = render(
			<Harness initial={null}>
				<UploadField label='CV' dragDropSize='small' />
			</Harness>
		)
		expect(screen.getByText('Chọn hoặc kéo thả để tải lên')).toBeTruthy()
		expect(screen.queryByText('Drag & Drop a file here')).toBeNull()

		chooseFile(fileInput(container), [fileOf('cv.pdf', 10)])
		expect(screen.getByText('cv.pdf')).toBeTruthy()
		expect(screen.queryByText('Chọn hoặc kéo thả để tải lên')).toBeNull()
	})

	it('shows errors only once touched', async () => {
		const { container } = render(
			<Harness initial={null} validators={requiredWhenEmpty}>
				<UploadField label='CV' />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())

		fireEvent.blur(fileInput(container))
		expect(await screen.findByText('Required')).toBeTruthy()
	})
})

describe('AvatarField', () => {
	it('renders the optional label, and no label without one', async () => {
		const { rerender } = render(
			<Harness initial={null}>
				<AvatarField label='Photo' />
			</Harness>
		)
		expect(screen.getByText('Photo')).toBeTruthy()

		rerender(
			<Harness initial={null}>
				<AvatarField />
			</Harness>
		)
		expect(screen.queryByText('Photo')).toBeNull()
	})

	it('stores a chosen file and null when cleared', async () => {
		const { container } = render(
			<Harness initial={null}>
				<AvatarField label='Photo' />
			</Harness>
		)
		chooseFile(fileInput(container), [fileOf('me.png', 10)])
		await expectValue('file:me.png')

		chooseFile(fileInput(container), [])
		await expectValue('null')
	})

	it('ignores a file over the limit (2 MB by default)', async () => {
		const { container } = render(
			<Harness initial={null}>
				<AvatarField label='Photo' />
			</Harness>
		)
		chooseFile(fileInput(container), [
			fileOf('big.png', 2 * 1024 * 1024 + 1)
		])
		await expectValue('null')

		chooseFile(fileInput(container), [fileOf('edge.png', 2 * 1024 * 1024)])
		await expectValue('file:edge.png')
	})

	it('honours a custom maxSize', async () => {
		const { container } = render(
			<Harness initial={null}>
				<AvatarField label='Photo' maxSize={50} />
			</Harness>
		)
		chooseFile(fileInput(container), [fileOf('big.png', 51)])
		await expectValue('null')
	})

	it('shows errors only once touched', async () => {
		const { container } = render(
			<Harness initial={null} validators={requiredWhenEmpty}>
				<AvatarField label='Photo' />
			</Harness>
		)
		await waitFor(() => expect(screen.queryByText('Required')).toBeNull())
		fireEvent.blur(fileInput(container))
		expect(await screen.findByText('Required')).toBeTruthy()
	})
})
