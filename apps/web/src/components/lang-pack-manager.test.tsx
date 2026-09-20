import { mockFetch } from '@/test/fetch-mock'
import { Toaster } from '@/components/ui/sonner'
import i18n from '@/i18n'
import { applyLangPacks } from '@/i18n/lang-packs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import LangPackManager from './lang-pack-manager'

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

afterEach(async () => {
	applyLangPacks({})
	await i18n.changeLanguage('vi')
})

// Stands in for the rest of the app, which shows packs through i18n.
function Probe() {
	const { t } = useTranslation()
	return <span data-testid='probe'>{t('actions.refresh')}</span>
}

// A tiny in-memory stand-in for the API's storage.
function fakeServer(initial: Record<string, unknown> = {}) {
	const packs: Record<string, unknown> = { ...initial }
	const fetch = mockFetch((req) => {
		if (req.path === '/lang-packs' && req.method === 'GET') {
			return { body: { packs } }
		}
		const language = req.path.split('/')[2]
		if (req.method === 'PUT') {
			packs[language] = (req.body as { pack: unknown }).pack
			return { body: { language } }
		}
		if (req.method === 'DELETE') {
			delete packs[language]
			return { body: { language } }
		}
		return { status: 404 }
	})
	return { ...fetch, packs }
}

function setup() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	render(
		<QueryClientProvider client={client}>
			<Toaster />
			<Probe />
			<LangPackManager />
		</QueryClientProvider>
	)
}

const fileInput = (label: string) =>
	screen.getByLabelText(new RegExp(`^${label}:`)) as HTMLInputElement

function upload(label: string, name: string, content: string) {
	fireEvent.change(fileInput(label), {
		target: {
			files: [new File([content], name, { type: 'application/json' })]
		}
	})
}

const puts = (requests: { method: string }[]) =>
	requests.filter((r) => r.method === 'PUT')

describe('LangPackManager', () => {
	it('shows which languages run on a custom pack', async () => {
		fakeServer({ en: { common: { actions: { refresh: 'Reload' } } } })
		setup()

		const cards = await screen.findAllByText(
			/Mặc định|Đang dùng gói tùy chỉnh/
		)
		await waitFor(() =>
			expect(cards.map((c) => c.textContent)).toEqual([
				'Mặc định',
				'Đang dùng gói tùy chỉnh'
			])
		)
	})

	it('uploads a pack, dropping unknown keys, and the app then shows the new text', async () => {
		const server = fakeServer()
		setup()
		await screen.findByText('Tiếng Việt')

		upload(
			'Tiếng Việt',
			'vi.json',
			JSON.stringify({
				common: { actions: { refresh: 'Tải lại' }, notAKey: 'x' }
			})
		)

		await waitFor(() =>
			expect(screen.getByTestId('probe').textContent).toBe('Tải lại')
		)
		const sent = puts(server.requests)
		expect(sent).toHaveLength(1)
		expect(sent[0]).toMatchObject({
			path: '/lang-packs/vi',
			body: { pack: { common: { actions: { refresh: 'Tải lại' } } } }
		})
		expect(await screen.findByText('Đã áp dụng 1 chuỗi.')).toBeTruthy()
		expect(screen.getByText('common.notAKey')).toBeTruthy()
		expect(await screen.findByText('Đang dùng gói tùy chỉnh')).toBeTruthy()
	})

	it.each([
		[
			'a file that is not JSON',
			'vi.json',
			'{oops',
			'Nội dung tệp không phải JSON hợp lệ'
		],
		[
			'a file without the .json extension',
			'vi.txt',
			'{}',
			'Chỉ nhận tệp có đuôi .json'
		],
		[
			'a pack matching nothing',
			'vi.json',
			'{"ghost":{"a":"b"}}',
			'Tệp không có chuỗi nào khớp với hệ thống'
		]
	])(
		'rejects %s without contacting the server',
		async (_l, name, content, message) => {
			const server = fakeServer()
			setup()
			await screen.findByText('Tiếng Việt')

			upload('Tiếng Việt', name, content)

			expect(await screen.findByText(message)).toBeTruthy()
			expect(puts(server.requests)).toHaveLength(0)
		}
	)

	it('reports the server refusing an upload and keeps the current text', async () => {
		mockFetch((req) =>
			req.method === 'PUT'
				? {
						status: 403,
						body: {
							code: 'permission_denied',
							message:
								'Chỉ quản trị viên cấp cao mới được thay đổi gói ngôn ngữ'
						}
					}
				: { body: { packs: {} } }
		)
		setup()
		await screen.findByText('Tiếng Việt')

		upload(
			'Tiếng Việt',
			'vi.json',
			JSON.stringify({ common: { actions: { refresh: 'Tải lại' } } })
		)

		expect(
			await screen.findByText(
				'Chỉ quản trị viên cấp cao mới được thay đổi gói ngôn ngữ'
			)
		).toBeTruthy()
		expect(screen.getByTestId('probe').textContent).toBe('Làm mới')
	})

	it('restores defaults after confirmation', async () => {
		const server = fakeServer({
			vi: { common: { actions: { refresh: 'Tải lại' } } }
		})
		setup()
		await waitFor(() =>
			expect(screen.getByTestId('probe').textContent).toBe('Tải lại')
		)

		fireEvent.click(
			await screen.findByRole('button', { name: 'Khôi phục mặc định' })
		)
		const dialog = await screen.findByRole('dialog')
		expect(server.requests.some((r) => r.method === 'DELETE')).toBe(false)
		fireEvent.click(
			within(dialog).getByRole('button', { name: 'Khôi phục' })
		)

		await waitFor(() =>
			expect(screen.getByTestId('probe').textContent).toBe('Làm mới')
		)
		expect(
			server.requests.filter((r) => r.method === 'DELETE')[0]?.path
		).toBe('/lang-packs/vi')
		expect(server.packs).toEqual({})
	})

	it('speaks the current language on its own page', async () => {
		fakeServer()
		await i18n.changeLanguage('en')
		setup()

		expect(await screen.findByText('English')).toBeTruthy()
		expect((await screen.findAllByText('Default')).length).toBe(2)
	})
})
