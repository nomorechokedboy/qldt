import { mockFetch } from '@/test/fetch-mock'
import type { Student } from '@/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import StudentInfo from '.'

vi.setConfig({ testTimeout: 20_000 })

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

afterEach(() => localStorage.clear())

const student = {
	id: 11,
	createdAt: '',
	updatedAt: '',
	studentId: 'SV1',
	fullName: 'Nguyen Van A',
	dob: '1999-01-02',
	rank: 'Thiếu úy',
	position: 'Dai doi truong',
	unit: { id: 2, name: 'Dai doi 1' },
	politicalOrg: 'cpv',
	politicalOrgOfficialDate: '2015-03-26',
	cpvOfficialAt: '2020-05-19',
	fatherDob: '1970-12-31',
	isMarried: true,
	spouseName: 'Tran Thi B',
	childrenInfos: [{ fullName: 'Be A', dob: '05/06/2022' }],
	status: 'pending'
} as Student

// The action bar reads the signed-in user, which needs a router.
async function setup(current: Student = student, readOnly = false) {
	mockFetch(() => ({ body: { data: [] } }))
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const root = createRootRoute()
	const index = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => <StudentInfo student={current} readOnly={readOnly} />
	})
	const router = createRouter({
		routeTree: root.addChildren([index]),
		history: createMemoryHistory({ initialEntries: ['/'] })
	})
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
	await screen.findAllByText(current.fullName as string)
}

// The desktop list and the mobile pills both render, so take the first.
const openSection = (name: RegExp) =>
	fireEvent.click(screen.getAllByRole('button', { name })[0])

describe('StudentInfo', () => {
	it('puts who the record is about on the cover', async () => {
		await setup()

		expect(screen.getAllByText('Nguyen Van A').length).toBeGreaterThan(0)
		expect(screen.getByText('Dai doi 1')).toBeTruthy()
		expect(
			screen.getAllByAltText('Ảnh 3x4 của quân nhân').length
		).toBeGreaterThan(0)
	})

	it('names the position instead of showing its alias', async () => {
		await setup({
			...student,
			position: 'dai doi truong',
			positionRef: { name: 'Đại đội trưởng' }
		} as Student)

		expect(screen.getAllByText('Đại đội trưởng').length).toBeGreaterThan(0)
		expect(screen.queryByText('dai doi truong')).toBeNull()
	})

	it('reads stored dates as day/month/year', async () => {
		await setup()

		expect(screen.getByText('02/01/1999')).toBeTruthy()
	})

	it('shows the political organisation by name and its dates', async () => {
		await setup()
		openSection(/Quân sự/)

		expect(screen.getByText('19/05/2020')).toBeTruthy()
		expect(screen.getByText('26/03/2015')).toBeTruthy()
		expect(screen.queryByText('cpv')).toBeNull()
	})

	it('lists the family and marks the open section', async () => {
		await setup()
		openSection(/Gia đình/)

		expect(await screen.findByText('Be A')).toBeTruthy()
		expect(screen.getByText('05/06/2022')).toBeTruthy()
		expect(screen.getByText('31/12/1970')).toBeTruthy()
		expect(screen.getByText('Tran Thi B')).toBeTruthy()
		expect(
			screen
				.getAllByRole('button', { name: /Gia đình/ })[0]
				.getAttribute('aria-current')
		).toBe('page')
	})

	it('says so when there are no children', async () => {
		await setup({ ...student, childrenInfos: [] })
		openSection(/Gia đình/)

		expect(screen.getByText('Chưa có thông tin con cái')).toBeTruthy()
	})

	it('opens the edit form from the action bar', async () => {
		await setup()

		fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa/ }))

		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'Lưu thay đổi' })
			).toBeTruthy()
		)
	})

	it('hides editing once the record is confirmed', async () => {
		await setup({ ...student, status: 'confirmed' })

		expect(screen.getByText('Đã xác nhận')).toBeTruthy()
		expect(screen.queryByRole('button', { name: /Chỉnh sửa/ })).toBeNull()
	})

	it('offers no editing when read only, even for an unconfirmed record', async () => {
		await setup(student, true)

		expect(screen.queryByRole('button', { name: /Chỉnh sửa/ })).toBeNull()
	})
})
