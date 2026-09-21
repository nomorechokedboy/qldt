import { mockFetch, type RecordedRequest } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider
} from '@tanstack/react-router'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TransferRequestsTab from '@/components/transfer-requests'

vi.setConfig({ testTimeout: 20_000 })

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
})

afterEach(() => {
	vi.unstubAllGlobals()
})

const base = '/transfer-requests'
const requester = { id: 1, displayName: 'Nguyễn Chỉ huy' }
const approver = { id: 2, displayName: 'Trần Phê duyệt' }
const unit = (id: number, name: string) => ({
	id,
	name,
	alias: name,
	level: 'battalion'
})

const request = (over: Record<string, unknown> = {}) => ({
	id: 1,
	status: 'pending',
	rejectionReason: null,
	decidedAt: null,
	createdAt: '2026-08-30 01:00:00',
	updatedAt: '2026-08-30 01:00:00',
	sourceUnit: unit(5, 'Tiểu đoàn 1'),
	destinationUnit: unit(6, 'Tiểu đoàn 2'),
	destinationRoom: null,
	requestedBy: requester,
	approver,
	decidedBy: null,
	troopers: [
		{
			id: 10,
			itemStatus: 'pending',
			failureReason: null,
			student: { id: 100, fullName: 'Lê Văn A' }
		}
	],
	materialAssetItems: [],
	materialStockItems: [],
	canDecide: true,
	...over
})

const assetItem = {
	id: 20,
	itemStatus: 'failed',
	failureReason: 'Đang được sử dụng',
	materialAsset: { id: 200, serialNumber: 'SN-0001' }
}
const stockItem = {
	id: 30,
	itemStatus: 'approved',
	failureReason: null,
	condition: 'good',
	quantity: 7,
	materialType: { id: 300, name: 'Áo mưa' }
}

async function renderTab(requests_: Record<string, unknown>[]) {
	const mock = mockFetch((req) => {
		if (req.path === '/authn/me') {
			return {
				body: { data: { id: 1 }, permissions: [], isSuperAdmin: true }
			}
		}
		if (req.method === 'GET' && req.path === base) {
			return { body: { data: requests_ } }
		}
		if (req.method === 'POST' && req.path.startsWith(`${base}/`)) {
			return { body: { data: requests_[0] } }
		}
		if (req.method === 'GET' && req.path.endsWith('/export-handover')) {
			return { body: {} }
		}
		return { status: 404 }
	})
	const root = createRootRoute()
	const page = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: TransferRequestsTab
	})
	const router = createRouter({
		routeTree: root.addChildren([page]),
		history: createMemoryHistory({ initialEntries: ['/'] })
	})
	render(
		<QueryClientProvider
			client={
				new QueryClient({
					defaultOptions: {
						queries: { retry: false },
						mutations: { retry: false }
					}
				})
			}
		>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
	return mock
}

const listCalls = (requests: RecordedRequest[]) =>
	requests.filter((r) => r.method === 'GET' && r.path === base)
const postCalls = (requests: RecordedRequest[]) =>
	requests.filter((r) => r.method === 'POST')

const openDetail = async () => {
	fireEvent.click(await screen.findByRole('button', { name: 'Xem' }))
	const sheet = await screen.findByRole('dialog')
	await within(sheet).findByText('Chi tiết yêu cầu bàn giao')
	return sheet
}

describe('transfer requests tab', () => {
	it('lists the requests with source, destination and what is moving', async () => {
		await renderTab([
			request({
				materialAssetItems: [assetItem],
				materialStockItems: [stockItem]
			})
		])

		expect(await screen.findByText('Tiểu đoàn 1')).toBeTruthy()
		expect(screen.getByText('Tiểu đoàn 2')).toBeTruthy()
		expect(
			screen.getByText('1 quân nhân, 1 khí tài, 1 vật tư')
		).toBeTruthy()
		expect(screen.getByText('Nguyễn Chỉ huy')).toBeTruthy()
		expect(screen.getByText('Trần Phê duyệt')).toBeTruthy()
		expect(screen.getByText('Chờ duyệt')).toBeTruthy()
	})

	it('says so when there are no requests', async () => {
		await renderTab([])

		expect(
			await screen.findByText('Không có yêu cầu bàn giao nào')
		).toBeTruthy()
	})

	it('asks the server for one status when the list is filtered', async () => {
		const { requests } = await renderTab([request()])
		await screen.findByText('Nguyễn Chỉ huy')
		expect(listCalls(requests)[0].url.searchParams.get('status')).toBeNull()

		const [filter] = await screen.findAllByRole('combobox')
		fireEvent.keyDown(filter, { key: 'Enter' })
		fireEvent.keyDown(
			await screen.findByRole('option', { name: 'Đã duyệt' }),
			{
				key: 'Enter'
			}
		)

		await waitFor(() =>
			expect(
				listCalls(requests).some(
					(r) => r.url.searchParams.get('status') === 'approved'
				)
			).toBe(true)
		)
	})

	it('shows the header details and rejection reason in the detail sheet', async () => {
		await renderTab([
			request({
				status: 'rejected',
				rejectionReason: 'Thiếu hồ sơ',
				destinationRoom: { id: 9, name: 'Kho số 3' }
			})
		])

		const sheet = await openDetail()

		for (const text of [
			'Tiểu đoàn 1',
			'Tiểu đoàn 2',
			'Kho số 3',
			'Nguyễn Chỉ huy',
			'Trần Phê duyệt',
			'Đã từ chối',
			'Thiếu hồ sơ',
			'Lê Văn A'
		]) {
			expect(within(sheet).getByText(text)).toBeTruthy()
		}
	})

	it('shows the troopers, assets and stocks with their own status and failure', async () => {
		await renderTab([
			request({
				materialAssetItems: [assetItem],
				materialStockItems: [stockItem]
			})
		])

		const sheet = await openDetail()

		expect(within(sheet).getByText('Khí tài')).toBeTruthy()
		expect(within(sheet).getByText('SN-0001')).toBeTruthy()
		expect(within(sheet).getByText('Thất bại')).toBeTruthy()
		expect(within(sheet).getByText('Đang được sử dụng')).toBeTruthy()
		expect(within(sheet).getByText('Vật tư')).toBeTruthy()
		expect(
			within(sheet).getByText(/Áo mưa\s+\(good\)\s+x\s+7/)
		).toBeTruthy()
		expect(within(sheet).getByText('Thành công')).toBeTruthy()
	})

	it('leaves out the sections that have nothing in them', async () => {
		await renderTab([request()])

		const sheet = await openDetail()

		expect(within(sheet).queryByText('Khí tài')).toBeNull()
		expect(within(sheet).queryByText('Vật tư')).toBeNull()
	})

	it('approves once the user confirms, then reloads the list', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		)
		const { requests } = await renderTab([request()])

		fireEvent.click(await screen.findByRole('button', { name: 'Duyệt' }))

		await waitFor(() =>
			expect(postCalls(requests).map((r) => r.path)).toEqual([
				`${base}/1/approve`
			])
		)
		expect(confirm).toHaveBeenCalledWith(
			'Bạn có chắc muốn duyệt yêu cầu bàn giao này?'
		)
		await waitFor(() =>
			expect(listCalls(requests).length).toBeGreaterThan(1)
		)
	})

	it('does nothing when the user declines the confirmation', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => false)
		)
		const { requests } = await renderTab([request()])

		fireEvent.click(await screen.findByRole('button', { name: 'Duyệt' }))
		fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

		expect(confirm).toHaveBeenCalledTimes(2)
		expect(postCalls(requests)).toEqual([])
	})

	it('lets the requester cancel their own pending request', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		)
		const { requests } = await renderTab([request()])

		fireEvent.click(await screen.findByRole('button', { name: 'Hủy' }))

		await waitFor(() =>
			expect(postCalls(requests).map((r) => r.path)).toEqual([
				`${base}/1/cancel`
			])
		)
	})

	it('offers no cancel to someone else, and no decision once it is decided', async () => {
		await renderTab([
			request({ requestedBy: { id: 9, displayName: 'Người khác' } }),
			request({ id: 2, status: 'approved' })
		])
		await screen.findByText('Người khác')

		expect(screen.queryByRole('button', { name: 'Hủy' })).toBeNull()
		expect(screen.getAllByRole('button', { name: 'Duyệt' })).toHaveLength(1)
		expect(screen.getAllByRole('button', { name: 'Từ chối' })).toHaveLength(
			1
		)
	})

	it('offers no decision to an approver who cannot decide this one', async () => {
		await renderTab([request({ canDecide: false })])
		await screen.findByText('Nguyễn Chỉ huy')

		expect(screen.queryByRole('button', { name: 'Duyệt' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Từ chối' })).toBeNull()
	})

	it('rejects with the reason the approver gives', async () => {
		const { requests } = await renderTab([request()])

		fireEvent.click(await screen.findByRole('button', { name: 'Từ chối' }))
		const dialog = await screen.findByRole('dialog')
		expect(
			within(dialog).getByText('Từ chối yêu cầu bàn giao')
		).toBeTruthy()
		fireEvent.change(within(dialog).getByRole('textbox'), {
			target: { value: 'Thiếu hồ sơ' }
		})
		fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))

		await waitFor(() =>
			expect(postCalls(requests).map((r) => [r.path, r.body])).toEqual([
				[`${base}/1/reject`, { reason: 'Thiếu hồ sơ' }]
			])
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})

	it('does not send a rejection without a reason', async () => {
		const { requests } = await renderTab([request()])

		fireEvent.click(await screen.findByRole('button', { name: 'Từ chối' }))
		const dialog = await screen.findByRole('dialog')
		fireEvent.change(within(dialog).getByRole('textbox'), {
			target: { value: '   ' }
		})
		fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))

		expect(postCalls(requests)).toEqual([])
		expect(screen.getByRole('dialog')).toBeTruthy()
	})

	describe('handover minutes', () => {
		it('are offered for an approved request that moves materials', async () => {
			await renderTab([
				request({ status: 'approved', materialAssetItems: [assetItem] })
			])

			expect(
				await screen.findByRole('button', { name: 'Xuất biên bản' })
			).toBeTruthy()
		})

		it('are not offered while pending, or when only troopers move', async () => {
			await renderTab([
				request({ materialAssetItems: [assetItem] }),
				request({ id: 2, status: 'approved' })
			])
			await screen.findAllByRole('button', { name: 'Xem' })

			expect(
				screen.queryByRole('button', { name: 'Xuất biên bản' })
			).toBeNull()
		})

		it('are requested from the server for that request', async () => {
			const { requests } = await renderTab([
				request({ status: 'approved', materialStockItems: [stockItem] })
			])

			fireEvent.click(
				await screen.findByRole('button', { name: 'Xuất biên bản' })
			)

			await waitFor(() =>
				expect(
					requests.some(
						(r) =>
							r.method === 'GET' &&
							r.path === `${base}/1/export-handover`
					)
				).toBe(true)
			)
		})
	})
})
