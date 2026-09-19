import type { Student } from '@/types'
import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import StudentEditForm from '.'

// Rendering the whole form is slow, most of all on the first, cold run.
vi.setConfig({ testTimeout: 20_000 })

// Radix Select leans on browser APIs jsdom does not implement.
beforeAll(() => {
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

const company = {
	id: 2,
	alias: 'c1',
	name: 'Dai doi 1',
	level: 'company'
}
const position = {
	id: 7,
	level: 'company',
	code: 'cdt',
	name: 'Dai doi truong',
	priority: 1,
	group: null
}

const student = {
	id: 11,
	createdAt: '',
	updatedAt: '',
	studentId: 'SV1',
	fullName: 'Nguyen Van A',
	dob: '1999-01-02',
	rank: 'Thiếu úy',
	unitId: company.id,
	positionId: position.id,
	politicalOrg: 'cpv',
	politicalOrgOfficialDate: '2015-03-26',
	cpvOfficialAt: '2020-05-19',
	fatherDob: '1970-12-31',
	isMarried: true,
	childrenInfos: [{ fullName: 'Be A', dob: '05/06/2022' }]
} as Student

function setup(current: Student = student) {
	const mock = mockFetch(({ path }) => {
		if (path === '/units') return { body: { data: [company] } }
		if (path === '/positions') return { body: { data: [position] } }
		return { body: { data: [] } }
	})
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const onClose = vi.fn()
	render(
		<QueryClientProvider client={client}>
			<StudentEditForm student={current} onClose={onClose} />
		</QueryClientProvider>
	)
	return { ...mock, onClose }
}

// The desktop list and the mobile pills both render, so take the first.
const openTab = (name: RegExp) =>
	fireEvent.click(screen.getAllByRole('button', { name })[0])

const selectTexts = () =>
	screen.getAllByRole('combobox').map((c) => c.textContent ?? '')

const inputValue = (label: string) =>
	(screen.getByLabelText(label) as HTMLInputElement).value

describe('StudentEditForm', () => {
	it('shows the stored position and unit in their selects', async () => {
		setup()
		openTab(/Quân sự/)

		await waitFor(() =>
			expect(selectTexts().join('|')).toContain('Dai doi truong')
		)
		expect(selectTexts().join('|')).toContain('Dai doi 1')
	})

	it('shows dates as day/month/year', async () => {
		setup()
		expect(inputValue('Ngày sinh')).toBe('02/01/1999')

		openTab(/Quân sự/)
		await waitFor(() =>
			expect(inputValue('Ngày vào Đảng')).toBe('19/05/2020')
		)
		expect(inputValue('Ngày vào Đoàn')).toBe('26/03/2015')
	})

	it('offers a calendar for date fields', async () => {
		setup()
		openTab(/Quân sự/)

		await screen.findByLabelText('Ngày vào Đảng')
		expect(
			screen.getAllByRole('button', { name: /Select date/ }).length
		).toBeGreaterThan(0)
	})

	it('saves dates as ISO and ids as numbers', async () => {
		const { requests, onClose } = setup()
		openTab(/Quân sự/)
		await waitFor(() =>
			expect(selectTexts().join('|')).toContain('Dai doi truong')
		)

		fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/ }))

		await waitFor(() => expect(onClose).toHaveBeenCalled())
		const patch = requests.find((r) => r.method === 'PATCH')
		const saved = (patch?.body as { data: Record<string, unknown>[] })
			.data[0]
		expect(saved).toMatchObject({
			id: 11,
			unitId: 2,
			positionId: 7,
			dob: '1999-01-02',
			politicalOrgOfficialDate: '2015-03-26',
			cpvOfficialAt: '2020-05-19',
			fatherDob: '1970-12-31'
		})
	})

	it('keeps the children dates day/month/year', async () => {
		const { requests, onClose } = setup()
		openTab(/Gia đình/)
		await waitFor(() => expect(screen.getByDisplayValue('05/06/2022')))

		fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/ }))

		await waitFor(() => expect(onClose).toHaveBeenCalled())
		const patch = requests.find((r) => r.method === 'PATCH')
		const saved = (patch?.body as { data: Record<string, unknown>[] })
			.data[0]
		expect(saved.childrenInfos).toEqual([
			{ fullName: 'Be A', dob: '05/06/2022' }
		])
	})

	it('keeps a stored value that is not among the options selectable', async () => {
		setup({ ...student, rank: 'Cấp bậc cũ' })
		openTab(/Quân sự/)

		await waitFor(() =>
			expect(selectTexts().join('|')).toContain('Cấp bậc cũ')
		)
	})

	it('refuses to save an incomplete date', async () => {
		const { requests, onClose } = setup()
		fireEvent.change(screen.getByLabelText('Ngày sinh'), {
			target: { value: '02/01/19' }
		})

		fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/ }))

		expect(
			await screen.findByText(/theo định dạng dd\/mm\/yyyy/)
		).toBeTruthy()
		expect(requests.some((r) => r.method === 'PATCH')).toBe(false)
		expect(onClose).not.toHaveBeenCalled()
	})

	it('clears the party entry date when it is emptied', async () => {
		const { requests, onClose } = setup()
		openTab(/Quân sự/)
		fireEvent.change(await screen.findByLabelText('Ngày vào Đảng'), {
			target: { value: '' }
		})

		fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/ }))

		await waitFor(() => expect(onClose).toHaveBeenCalled())
		const patch = requests.find((r) => r.method === 'PATCH')
		const saved = (patch?.body as { data: Record<string, unknown>[] })
			.data[0]
		expect(saved.cpvOfficialAt).toBeNull()
	})

	it('marks the open section and shows the record on the cover', async () => {
		setup()
		expect(screen.getAllByText('Nguyen Van A').length).toBeGreaterThan(0)

		openTab(/Gia đình/)

		const current = (name: RegExp) =>
			screen
				.getAllByRole('button', { name })[0]
				.getAttribute('aria-current')
		await waitFor(() => expect(current(/Gia đình/)).toBe('page'))
		expect(current(/Thông tin cá nhân/)).toBeNull()
	})
})
