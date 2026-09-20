import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

vi.setConfig({ testTimeout: 20_000 })

beforeAll(() => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent: () => false,
		onchange: null
	}))
})

async function renderAs(isSuperAdmin: boolean, permissions: string[] = []) {
	mockFetch((req) =>
		req.path === '/authn/me'
			? { body: { data: { id: 1 }, permissions, isSuperAdmin } }
			: { status: 404 }
	)
	const root = createRootRoute()
	const page = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => (
			<ProtectedRoute superAdminOnly>
				<p>secret settings</p>
			</ProtectedRoute>
		)
	})
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory({ initialEntries: ['/'] })
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
}

describe('ProtectedRoute superAdminOnly', () => {
	it('shows the page to a super admin', async () => {
		await renderAs(true)

		expect(await screen.findByText('secret settings')).toBeTruthy()
	})

	it('keeps it from a signed-in user who is not a super admin, whatever their permissions', async () => {
		await renderAs(false, ['roles:read', 'users:read'])

		expect(await screen.findByText('Không có quyền truy cập')).toBeTruthy()
		expect(screen.queryByText('secret settings')).toBeNull()
	})
})
