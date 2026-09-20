import { mockFetch } from '@/test/fetch-mock'
import type { Student, Unit } from '@/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import UnitRollupTables from './unit-rollup-tables'

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

const battalion = {
	id: 1,
	name: 'Tieu doan 1',
	alias: 'd1',
	level: 'battalion'
} as Unit

const trooper = {
	id: 11,
	fullName: 'Nguyen Van A',
	dob: '1999-01-02',
	rank: 'Thiếu úy',
	position: 'Dai doi truong',
	unit: { id: 1, name: 'Tieu doan 1' },
	birthPlace: 'Ha Noi'
} as Student

const stock = {
	id: 1,
	quantity: 3,
	condition: 'good',
	unit: { id: 1, name: 'Tieu doan 1' },
	materialType: { id: 5, name: 'Chieu', unitOfMeasure: 'cai' }
}

const asset = {
	id: 1,
	serialNumber: 'AK-001',
	status: 'available',
	materialType: { id: 6, name: 'AK' }
}

async function setup() {
	const mock = mockFetch(({ path }) => {
		if (path.endsWith('/stats/students'))
			return { body: { data: [trooper] } }
		if (path.endsWith('/stats/material-stocks'))
			return { body: { data: [stock] } }
		if (path.endsWith('/stats/material-assets'))
			return { body: { data: [asset] } }
		return { body: { data: [] } }
	})
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const root = createRootRoute()
	const index = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => (
			<UnitRollupTables
				unitId={battalion.id}
				unit={battalion}
				unitsById={new Map([[battalion.id, battalion]])}
			/>
		)
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
	return mock
}

const openTab = async (name: RegExp) =>
	fireEvent.mouseDown(await screen.findByRole('tab', { name }), {
		button: 0
	})

const button = (name: RegExp) => screen.findAllByRole('button', { name })

describe('UnitRollupTables', () => {
	it('lets the troopers be filtered and exported', async () => {
		await setup()
		await screen.findByText('Nguyen Van A', {}, { timeout: 10_000 })

		for (const name of [/Cấp bậc/, /Dân tộc/, /Tình trạng/]) {
			expect((await button(name)).length).toBeGreaterThan(0)
		}
		expect((await button(/Xuất dữ liệu/)).length).toBeGreaterThan(0)
		expect((await button(/Quản lý mẫu/)).length).toBeGreaterThan(0)
	})

	it('does not let a trooper be edited in the table', async () => {
		const { requests } = await setup()
		const name = await screen.findByText(
			'Nguyen Van A',
			{},
			{ timeout: 10_000 }
		)
		const inputsBefore = screen.queryAllByRole('textbox').length
		const selectsBefore = screen.queryAllByRole('combobox').length

		fireEvent.doubleClick(name)
		fireEvent.doubleClick(screen.getByText('Ha Noi'))
		fireEvent.doubleClick(screen.getByText('Dai doi truong'))

		expect(screen.queryAllByRole('textbox').length).toBe(inputsBefore)
		expect(screen.queryAllByRole('combobox').length).toBe(selectsBefore)
		expect(
			requests.filter((r) => r.method !== 'GET' && r.method !== 'POST')
		).toEqual([])
	})

	it('opens a trooper to read but not to edit or delete', async () => {
		await setup()
		await screen.findByText('Nguyen Van A', {}, { timeout: 10_000 })

		fireEvent.keyDown(screen.getByText('Open menu').closest('button')!, {
			key: 'Enter'
		})
		expect(await screen.findByText('Chi tiết')).toBeTruthy()
		expect(screen.queryByText('Xóa')).toBeNull()

		fireEvent.click(screen.getByText('Chi tiết'))
		expect(
			(await screen.findAllByText('Thông tin cá nhân')).length
		).toBeGreaterThan(0)
		expect(screen.queryByRole('button', { name: /Chỉnh sửa/ })).toBeNull()
		expect(
			screen.getByRole('button', { name: /Tải trích ngang/ })
		).toBeTruthy()
	})

	it('filters and exports the facilities', async () => {
		await setup()
		await openTab(/Cơ sở vật chất/)
		await screen.findByText('Chieu')

		for (const name of [/Loại vật tư/, /Tình trạng/, /Đơn vị/]) {
			expect((await button(name)).length).toBeGreaterThan(0)
		}
		expect((await button(/Xuất file/)).length).toBeGreaterThan(0)
	})

	it('filters and exports the equipment', async () => {
		await setup()
		await openTab(/Vũ khí/)
		await screen.findByText('AK-001')

		for (const name of [/Loại khí tài/, /Tình trạng/, /Trạng thái/]) {
			expect((await button(name)).length).toBeGreaterThan(0)
		}
		expect((await button(/Xuất file/)).length).toBeGreaterThan(0)
	})
})
