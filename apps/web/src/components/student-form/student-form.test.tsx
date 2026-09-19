import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import StudentForm from '.'

vi.setConfig({ testTimeout: 20_000 })

beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.scrollTo = vi.fn()
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
	URL.createObjectURL = vi.fn(() => 'blob:preview')
	URL.revokeObjectURL = vi.fn()
})

async function openForm() {
	mockFetch(() => ({ body: { data: [] } }))
	render(
		<QueryClientProvider client={new QueryClient()}>
			<StudentForm onSuccess={vi.fn()} />
		</QueryClientProvider>
	)
	fireEvent.click(screen.getByRole('button', { name: /Thêm quân nhân/ }))
	return screen.findByRole('dialog')
}

const stepsNav = (dialog: HTMLElement) =>
	within(within(dialog).getByRole('navigation', { name: 'Các bước' }))

describe('StudentForm', () => {
	it('shows the name on the record cover as it is typed', async () => {
		const dialog = await openForm()

		fireEvent.change(within(dialog).getByLabelText('Họ và tên'), {
			target: { value: 'Nguyễn Văn A' }
		})

		expect(
			within(dialog.querySelector('aside') as HTMLElement).getByText(
				'Nguyễn Văn A'
			)
		).toBeTruthy()
	})

	it('stays on the first step and shows errors when it is incomplete', async () => {
		const dialog = await openForm()

		fireEvent.click(
			within(dialog).getByRole('button', { name: /Tiếp theo/ })
		)

		expect(
			(
				await within(dialog).findAllByText(
					/không được bỏ trống/,
					undefined,
					{ timeout: 3000 }
				)
			).length
		).toBeGreaterThan(0)
		expect(
			stepsNav(dialog)
				.getByRole('button', { name: /Thông tin cá nhân/ })
				.getAttribute('aria-current')
		).toBe('step')
		expect(
			stepsNav(dialog)
				.getByRole('button', { name: /Thông tin khác/ })
				.hasAttribute('disabled')
		).toBe(true)
	})

	it('rejects a photo over 2 MB', async () => {
		const dialog = await openForm()
		const big = new File([new Uint8Array(2_000_001)], 'big.jpg', {
			type: 'image/jpeg'
		})

		fireEvent.change(within(dialog).getAllByLabelText('Ảnh quân nhân')[0], {
			target: { files: [big] }
		})

		expect(
			(await within(dialog).findAllByRole('alert'))[0].textContent
		).toMatch(/vượt quá 2 MB/)
	})

	it('previews a chosen photo', async () => {
		const dialog = await openForm()
		const photo = new File(['x'], 'me.jpg', { type: 'image/jpeg' })

		fireEvent.change(within(dialog).getAllByLabelText('Ảnh quân nhân')[0], {
			target: { files: [photo] }
		})

		expect(
			(
				await within(dialog).findAllByAltText('Ảnh 3x4 của quân nhân')
			)[0].getAttribute('src')
		).toBe('blob:preview')
	})
})
