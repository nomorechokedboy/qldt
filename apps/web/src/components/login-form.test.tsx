import { mockFetch } from '@/test/fetch-mock'
import i18n from '@/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'

vi.setConfig({ testTimeout: 20_000 })

afterEach(async () => {
	await i18n.changeLanguage('vi')
	localStorage.clear()
})

async function setup() {
	const fetchMock = mockFetch(() => ({ status: 401, body: {} }))
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const root = createRootRoute()
	const index = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: LoginForm
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
	await screen.findByRole('heading', { level: 1 })
	return fetchMock
}

const loginRequests = (requests: { path: string }[]) =>
	requests.filter((r) => r.path === '/authn/login')

describe('LoginForm', () => {
	it('speaks Vietnamese by default', async () => {
		await setup()

		expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
			'Đăng nhập'
		)
		expect(screen.getByLabelText('Tên đăng nhập')).toBeTruthy()
	})

	it('switches to English and remembers the choice', async () => {
		await setup()

		fireEvent.click(screen.getByRole('button', { name: 'English' }))

		expect(
			(await screen.findByRole('heading', { level: 1 })).textContent
		).toBe('Log in')
		expect(screen.getByLabelText('Username')).toBeTruthy()
		expect(document.documentElement.lang).toBe('en')
		expect(localStorage.getItem('qldt.lang')).toBe('en')
	})

	it('asks for both fields instead of sending an empty login', async () => {
		const { requests } = await setup()

		fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

		expect(
			await screen.findByText('Tên đăng nhập là bắt buộc')
		).toBeTruthy()
		expect(screen.getByText('Mật khẩu là bắt buộc')).toBeTruthy()
		expect(loginRequests(requests)).toHaveLength(0)
	})

	it('sends the credentials that were typed', async () => {
		const { requests } = await setup()

		fireEvent.change(screen.getByLabelText('Tên đăng nhập'), {
			target: { value: 'admin' }
		})
		fireEvent.change(screen.getByLabelText('Mật khẩu'), {
			target: { value: 's3cret' }
		})
		fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

		await waitFor(() => expect(loginRequests(requests)).toHaveLength(1))
		expect(loginRequests(requests)[0].body).toEqual({
			username: 'admin',
			password: 's3cret'
		})
	})
})
