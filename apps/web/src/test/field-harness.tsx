import { screen, waitFor } from '@testing-library/react'
import { cloneElement, type ReactElement } from 'react'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { useAppForm } from '@/hooks/use-app-form'

function show(value: unknown) {
	if (value instanceof File) return `file:${value.name}`
	if (value === null) return 'null'
	return JSON.stringify(value)
}

// One real form with a single `value` field, rendered through the same
// `useAppForm` the app uses. The `value` readout is the form's own state.
// The field's children are re-created on every render (as in the app's
// `children={(field) => <field.X />}`); a static element would never re-render.
export function Harness({
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

export const formValue = () => screen.getByTestId('value').textContent
// TanStack Form flushes store updates asynchronously.
export const expectValue = (expected: string) =>
	waitFor(() => expect(formValue()).toBe(expected))

export const requiredWhenEmpty = {
	onMount: () => 'Required',
	onChange: ({ value }: { value: unknown }) =>
		value ? undefined : 'Required'
}

// Radix Select/Popover/Slider and cmdk lean on browser APIs jsdom does not
// have. Call once at the top level of a test file.
export function installBrowserStubs() {
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
		// jsdom has no blob URLs; AvatarUpload previews a chosen file with one.
		URL.createObjectURL = vi.fn(() => 'blob:preview')
		URL.revokeObjectURL = vi.fn()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})
}
