import { SidebarProvider } from '@/components/ui/sidebar'
import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSidebar } from './app-sidebar'

beforeEach(() => {
	localStorage.clear()
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			matches: false,
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false,
			onchange: null
		}))
	)
})

afterEach(() => {
	vi.unstubAllGlobals()
	localStorage.clear()
})

const company = {
	id: 2,
	alias: 'c1',
	name: 'Dai doi 1',
	level: 'company',
	parent: null,
	children: [
		{ id: 4, alias: 'p1', name: 'Trung doi 1', level: 'platoon' },
		{ id: 5, alias: 'b1', name: 'Ban 1', level: 'section' }
	]
}
const battalion = {
	id: 1,
	alias: 'd1',
	name: 'Tieu doan 1',
	level: 'battalion',
	parent: null,
	children: [{ id: 2, alias: 'c1', name: 'Dai doi 1', level: 'company' }]
}
// A caller's flat scope: a company and its own platoon both come back.
const platoon = {
	id: 4,
	alias: 'p1',
	name: 'Trung doi 1',
	level: 'platoon',
	parent: { id: 2, name: 'Dai doi 1' },
	children: []
}

function tokenFor(payload: object) {
	return `x.${btoa(JSON.stringify(payload))}.y`
}

function setup({
	units = [battalion],
	user = { userId: 3, isSuperUser: false },
	superAdminToken = false,
	defaultOpen = true,
	path = '/'
}: {
	units?: unknown[]
	user?: { userId: number; isSuperUser: boolean }
	superAdminToken?: boolean
	defaultOpen?: boolean
	path?: string
} = {}) {
	if (superAdminToken) {
		localStorage.setItem('qlhvAccessToken', tokenFor({ isSuperUser: true }))
	}
	const mock = mockFetch(({ path }) => {
		if (path === '/authn/me')
			return {
				body: { data: user, permissions: [], isSuperAdmin: false }
			}
		if (path === '/units') return { body: { data: units } }
		return { body: { data: [] } }
	})
	const root = createRootRoute({
		component: () => (
			<SidebarProvider defaultOpen={defaultOpen}>
				<AppSidebar collapsible='icon' />
			</SidebarProvider>
		)
	})
	const page = createRoute({
		getParentRoute: () => root,
		path: '$',
		component: () => null
	})
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory({ initialEntries: [path] })
	})
	render(
		<QueryClientProvider
			client={
				new QueryClient({
					defaultOptions: { queries: { retry: false } }
				})
			}
		>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
	return mock
}

const link = (name: string) => screen.getByRole('link', { name })

describe('AppSidebar', () => {
	it('shows the app title and the fixed navigation groups', async () => {
		setup()

		expect(await screen.findByText('Chung')).toBeTruthy()
		// The app title, and the unit management link with the same words.
		expect(screen.getAllByText('Quản lý đơn vị')).toHaveLength(2)
		expect(screen.getByText('Tiểu đoàn 1, Lữ đoàn 75')).toBeTruthy()
		for (const group of [
			'Chung',
			'Thống kê đơn vị',
			'Đơn vị',
			'Vật tư',
			'Quân nhân'
		]) {
			expect(screen.getByText(group)).toBeTruthy()
		}
		expect(link('Trang chủ').getAttribute('href')).toBe('/')
		expect(link('Tổng hợp đơn vị').getAttribute('href')).toBe(
			'/thong-ke-doanh-trai'
		)
		expect(link('Danh mục vật tư').getAttribute('href')).toBe(
			'/quan-ly-vat-tu/danh-muc'
		)
		expect(link('Bàn giao quân số/vật chất').getAttribute('href')).toBe(
			'/chuyen-giao-tai-san'
		)
		expect(link('Đề xuất chế độ').getAttribute('href')).toBe(
			'/de-xuat-che-do'
		)
		expect(link('Đề xuất thăng quân hàm').getAttribute('href')).toBe(
			'/de-xuat-thang-quan-ham'
		)
		expect(link('Quản lý đơn vị').getAttribute('href')).toBe(
			'/quan-ly-don-vi'
		)
	})

	it('renders nothing but a skeleton until the units arrive', async () => {
		setup()

		expect(screen.queryByText('Chung')).toBeNull()
		expect(await screen.findByText('Chung')).toBeTruthy()
	})

	it('hides the user administration group from regular users', async () => {
		setup()

		await screen.findByText('Chung')
		expect(screen.queryByText('Quản lý người dùng')).toBeNull()
		expect(screen.queryByText('Danh sách người dùng')).toBeNull()
	})

	it('shows the user administration group to super admins', async () => {
		setup({ superAdminToken: true })

		expect(await screen.findByText('Quản lý người dùng')).toBeTruthy()
		expect(
			screen.getAllByRole('link', { name: 'Danh sách người dùng' })
		).toHaveLength(1)
		expect(link('Danh sách người dùng').getAttribute('href')).toBe(
			'/list-user'
		)
		expect(link('Danh sách vai trò').getAttribute('href')).toBe('/vai-tro')
		expect(link('Nhật ký hoạt động').getAttribute('href')).toBe(
			'/nhat-ky-hoat-dong'
		)
		expect(link('Chức vụ').getAttribute('href')).toBe('/chuc-vu')
		expect(link('Gói ngôn ngữ').getAttribute('href')).toBe(
			'/cai-dat-ngon-ngu'
		)
	})

	it('lists units for a super user too, with the same plain request', async () => {
		const { requests } = setup({ user: { userId: 7, isSuperUser: true } })

		expect(
			await screen.findByRole('button', { name: 'Tieu doan 1' })
		).toBeTruthy()
		const unitRequests = requests.filter((r) => r.path === '/units')
		expect(unitRequests).toHaveLength(1)
		expect(unitRequests[0].url.search).toBe('')
	})

	it('lists each unit as a collapsed entry that opens onto its overview and children', async () => {
		setup({ units: [battalion, company] })
		await screen.findByText('Chung')

		expect(screen.queryByRole('link', { name: 'Tổng quan' })).toBeNull()
		fireEvent.click(screen.getByRole('button', { name: 'Tieu doan 1' }))

		const overview = await screen.findByRole('link', { name: 'Tổng quan' })
		const href = overview.getAttribute('href') ?? ''
		expect(href.startsWith('/don-vi/d1')).toBe(true)
		expect(href).toContain('level=battalion')
		expect(href).toContain('id=1')
		expect(href).toContain('name=Tieu+doan+1')
		expect(link('Dai doi 1').getAttribute('href')).toContain('/dai-doi/c1')
	})

	it('routes company units to the company page and children by their level', async () => {
		setup({ units: [company] })
		await screen.findByText('Chung')

		fireEvent.click(screen.getByRole('button', { name: 'Dai doi 1' }))

		expect(
			(
				await screen.findByRole('link', { name: 'Tổng quan' })
			).getAttribute('href')
		).toContain('/dai-doi/c1')
		expect(link('Trung doi 1').getAttribute('href')).toContain(
			'/trung-doi/p1'
		)
		expect(link('Ban 1').getAttribute('href')).toContain('/don-vi/b1')
	})

	it('does not list a unit again at the top level when its parent is listed', async () => {
		setup({ units: [{ ...company, children: [{ ...platoon }] }, platoon] })
		await screen.findByText('Chung')

		expect(screen.getByRole('button', { name: 'Dai doi 1' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'Trung doi 1' })).toBeNull()
	})

	it('collapses and reopens a group from its heading', async () => {
		setup()
		await screen.findByText('Chung')
		expect(link('Trang chủ')).toBeTruthy()

		fireEvent.click(screen.getByText('Chung'))
		await waitFor(() =>
			expect(screen.queryByRole('link', { name: 'Trang chủ' })).toBeNull()
		)

		fireEvent.click(screen.getByText('Chung'))
		expect(
			await screen.findByRole('link', { name: 'Trang chủ' })
		).toBeTruthy()
	})

	it('marks the link of the current page as active', async () => {
		setup({ path: '/quan-ly-don-vi' })
		await screen.findByText('Chung')

		expect(link('Quản lý đơn vị').getAttribute('data-active')).toBe('true')
		expect(link('Trang chủ').getAttribute('data-active')).not.toBe('true')
	})

	it('keeps only icons when the sidebar is collapsed', async () => {
		setup({ defaultOpen: false })

		await waitFor(() =>
			expect(
				document.querySelector('a[href="/quan-ly-don-vi"]')
			).toBeTruthy()
		)
		expect(screen.queryByText('Tiểu đoàn 1, Lữ đoàn 75')).toBeNull()
		expect(screen.queryByText('Chung')).toBeNull()
		expect(screen.queryByText('Trang chủ')).toBeNull()
		expect(document.querySelector('a[href="/"] svg')).toBeTruthy()
	})
})
