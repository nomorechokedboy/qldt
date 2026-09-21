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
import { SidebarProvider } from '@/components/ui/sidebar'
import { Route as rolesRoute } from '@/routes/vai-tro'
import { Route as usersRoute } from '@/routes/list-user'
import { Route as auditRoute } from '@/routes/nhat-ky-hoat-dong'
import { Route as positionsRoute } from '@/routes/chuc-vu'
import { Route as permissionsRoute } from '@/routes/cac-quyen'
import { Route as languagesRoute } from '@/routes/cai-dat-ngon-ngu'

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

// The sidebar lists these pages under a super-admin-only group, so the pages
// themselves have to refuse everyone else too: nothing stops a user typing
// the address.
const adminPages = {
	'/vai-tro': rolesRoute,
	'/list-user': usersRoute,
	'/nhat-ky-hoat-dong': auditRoute,
	'/chuc-vu': positionsRoute,
	'/cac-quyen': permissionsRoute,
	'/cai-dat-ngon-ngu': languagesRoute
}

function renderPage(
	page: (typeof adminPages)[keyof typeof adminPages],
	isSuperAdmin: boolean,
	permissions: string[] = []
) {
	mockFetch((req) =>
		req.path === '/authn/me'
			? { body: { data: { id: 1 }, permissions, isSuperAdmin } }
			: { status: 404 }
	)
	const Component = page.options.component as React.ComponentType
	const root = createRootRoute()
	const child = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: () => (
			<SidebarProvider>
				<Component />
			</SidebarProvider>
		)
	})
	const router = createRouter({
		routeTree: root.addChildren([child]),
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

describe('admin pages', () => {
	for (const [path, page] of Object.entries(adminPages)) {
		it(`${path} is closed to a signed-in user who is not a super admin`, async () => {
			renderPage(page, false, [
				'roles:read',
				'users:read',
				'permissions:read'
			])

			expect(
				await screen.findByText('Không có quyền truy cập')
			).toBeTruthy()
		})

		it(`${path} is open to a super admin`, async () => {
			renderPage(page, true)

			// Wait for the auth check to settle, then look for the refusal.
			await new Promise((resolve) => setTimeout(resolve, 500))
			expect(screen.queryByText('Không có quyền truy cập')).toBeNull()
		})
	}
})
