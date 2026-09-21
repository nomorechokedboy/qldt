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
import type { ComponentType } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import ActivityStatusProposalsTab from '@/components/activity-status-proposals'
import RankPromotionProposalsTab from '@/components/rank-promotion-proposals'

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

afterEach(() => {
	vi.unstubAllGlobals()
	// unstubAllGlobals also removes the stubs above.
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	)
})

const unit = { id: 5, name: 'Tiểu đoàn 1', alias: 'd1', level: 'battalion' }
const requester = { id: 1, displayName: 'Nguyễn Chỉ huy' }
const approver = { id: 2, displayName: 'Trần Phê duyệt' }

type Kind = {
	name: string
	Tab: ComponentType
	base: string
	emptyText: string
	detailTitle: string
	confirmApprove: string
	rejectTitle: string
	// A header-level proposal of this kind, with one trooper.
	proposal: (over?: Record<string, unknown>) => Record<string, unknown>
}

const common = {
	id: 1,
	status: 'pending',
	note: null,
	rejectionReason: null,
	decidedAt: null,
	createdAt: '2026-08-30 01:00:00',
	updatedAt: '2026-08-30 01:00:00',
	unit,
	requestedBy: requester,
	approver,
	decidedBy: null,
	canDecide: true
}

const kinds: Kind[] = [
	{
		name: 'rank promotion',
		Tab: RankPromotionProposalsTab,
		base: '/rank-promotion-proposals',
		emptyText: 'Không có đề xuất thăng quân hàm nào',
		detailTitle: 'Chi tiết đề xuất thăng quân hàm',
		confirmApprove: 'Bạn có chắc muốn duyệt đề xuất thăng quân hàm này?',
		rejectTitle: 'Từ chối đề xuất thăng quân hàm',
		proposal: (over = {}) => ({
			...common,
			targetRank: 'Thượng úy',
			effectiveDate: '2026-09-01',
			troopers: [
				{
					id: 10,
					itemStatus: 'pending',
					failureReason: null,
					targetRank: null,
					effectiveDate: null,
					appliedAt: null,
					student: { id: 100, fullName: 'Lê Văn A' }
				}
			],
			...over
		})
	},
	{
		name: 'activity status',
		Tab: ActivityStatusProposalsTab,
		base: '/activity-status-proposals',
		emptyText: 'Không có đề xuất chế độ nào',
		detailTitle: 'Chi tiết đề xuất chế độ',
		confirmApprove: 'Bạn có chắc muốn duyệt đề xuất chế độ này?',
		rejectTitle: 'Từ chối đề xuất chế độ',
		proposal: (over = {}) => ({
			...common,
			targetActivityStatus: 'annual_leave',
			effectiveDate: null,
			startDate: '2026-09-01',
			endDate: '2026-09-30',
			troopers: [
				{
					id: 10,
					itemStatus: 'pending',
					failureReason: null,
					effectiveDate: null,
					startDate: null,
					endDate: null,
					appliedAt: null,
					revertedAt: null,
					student: { id: 100, fullName: 'Lê Văn A' }
				}
			],
			...over
		})
	}
]

const listCalls = (requests: RecordedRequest[], base: string) =>
	requests.filter((r) => r.method === 'GET' && r.path === base)

const postCalls = (requests: RecordedRequest[]) =>
	requests.filter((r) => r.method === 'POST')

async function renderTab(
	kind: Kind,
	proposals: Record<string, unknown>[],
	{ isSuperAdmin = true }: { isSuperAdmin?: boolean } = {}
) {
	const mock = mockFetch((req) => {
		if (req.path === '/authn/me') {
			return {
				body: {
					data: { id: 1 },
					permissions: [],
					isSuperAdmin
				}
			}
		}
		if (req.method === 'GET' && req.path === kind.base) {
			return { body: { data: proposals } }
		}
		if (req.method === 'POST' && req.path.startsWith(`${kind.base}/`)) {
			return { body: { data: proposals[0] } }
		}
		return { status: 404 }
	})
	const root = createRootRoute()
	const page = createRoute({
		getParentRoute: () => root,
		path: '/',
		component: kind.Tab
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

const openDetail = async (kind: Kind) => {
	fireEvent.click(await screen.findByRole('button', { name: 'Xem' }))
	const sheet = await screen.findByRole('dialog')
	await within(sheet).findByText(kind.detailTitle)
	return sheet
}

const pickFilter = async (label: string) => {
	const [filter] = await screen.findAllByRole('combobox')
	fireEvent.keyDown(filter, { key: 'Enter' })
	fireEvent.keyDown(await screen.findByRole('option', { name: label }), {
		key: 'Enter'
	})
}

describe.each(kinds)('$name proposals tab', (kind) => {
	it('lists the proposals with who asked and who decides', async () => {
		await renderTab(kind, [kind.proposal()])

		expect(await screen.findByText('Nguyễn Chỉ huy')).toBeTruthy()
		expect(screen.getByText('Trần Phê duyệt')).toBeTruthy()
		expect(screen.getByText('Tiểu đoàn 1')).toBeTruthy()
		expect(screen.getByText('Chờ duyệt')).toBeTruthy()
	})

	it('says so when there are no proposals', async () => {
		await renderTab(kind, [])

		expect(await screen.findByText(kind.emptyText)).toBeTruthy()
	})

	it('asks the server for one status when the list is filtered', async () => {
		const { requests } = await renderTab(kind, [kind.proposal()])
		await screen.findByText('Nguyễn Chỉ huy')
		expect(
			listCalls(requests, kind.base)[0].url.searchParams.get('status')
		).toBeNull()

		await pickFilter('Đã duyệt')

		await waitFor(() =>
			expect(
				listCalls(requests, kind.base).some(
					(r) => r.url.searchParams.get('status') === 'approved'
				)
			).toBe(true)
		)
	})

	it('shows the header details, note and rejection reason in the detail sheet', async () => {
		await renderTab(kind, [
			kind.proposal({
				status: 'rejected',
				note: 'Đủ điều kiện',
				rejectionReason: 'Thiếu hồ sơ'
			})
		])

		const sheet = await openDetail(kind)

		for (const text of [
			'Tiểu đoàn 1',
			'Nguyễn Chỉ huy',
			'Trần Phê duyệt',
			'Đã từ chối',
			'Đủ điều kiện',
			'Thiếu hồ sơ',
			'Lê Văn A'
		]) {
			expect(within(sheet).getByText(text)).toBeTruthy()
		}
		expect(within(sheet).getByText('Chờ duyệt')).toBeTruthy() // the trooper's own status
	})

	it('shows a trooper that failed, with the reason', async () => {
		const p = kind.proposal()
		const [t] = p.troopers as Record<string, unknown>[]
		await renderTab(kind, [
			{
				...p,
				troopers: [
					{
						...t,
						itemStatus: 'failed',
						failureReason: 'Đã chuyển đơn vị'
					}
				]
			}
		])

		const sheet = await openDetail(kind)

		expect(within(sheet).getByText('Thất bại')).toBeTruthy()
		expect(within(sheet).getByText('Đã chuyển đơn vị')).toBeTruthy()
	})

	it('shows when a trooper was applied', async () => {
		const p = kind.proposal()
		const [t] = p.troopers as Record<string, unknown>[]
		await renderTab(kind, [
			{
				...p,
				troopers: [
					{
						...t,
						itemStatus: 'approved',
						appliedAt: '2026-09-02 08:00:00'
					}
				]
			}
		])

		const sheet = await openDetail(kind)

		expect(
			within(sheet).getByText('Đã áp dụng: 02/09/2026 15:00:00')
		).toBeTruthy()
	})

	it('approves once the user confirms, then reloads the list', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		)
		const { requests } = await renderTab(kind, [kind.proposal()])

		fireEvent.click(await screen.findByRole('button', { name: 'Duyệt' }))

		await waitFor(() =>
			expect(postCalls(requests).map((r) => r.path)).toEqual([
				`${kind.base}/1/approve`
			])
		)
		expect(confirm).toHaveBeenCalledWith(kind.confirmApprove)
		await waitFor(() =>
			expect(listCalls(requests, kind.base).length).toBeGreaterThan(1)
		)
	})

	it('does nothing when the user declines the confirmation', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => false)
		)
		const { requests } = await renderTab(kind, [kind.proposal()])

		fireEvent.click(await screen.findByRole('button', { name: 'Duyệt' }))
		fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

		expect(confirm).toHaveBeenCalledTimes(2)
		expect(postCalls(requests)).toEqual([])
	})

	it('lets the requester cancel their own pending proposal', async () => {
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		)
		const { requests } = await renderTab(kind, [kind.proposal()])

		fireEvent.click(await screen.findByRole('button', { name: 'Hủy' }))

		await waitFor(() =>
			expect(postCalls(requests).map((r) => r.path)).toEqual([
				`${kind.base}/1/cancel`
			])
		)
	})

	it('offers no cancel to someone else, and no decision once it is decided', async () => {
		await renderTab(kind, [
			kind.proposal({
				requestedBy: { id: 9, displayName: 'Người khác' }
			}),
			kind.proposal({ id: 2, status: 'approved' })
		])
		await screen.findByText('Người khác')

		expect(screen.queryByRole('button', { name: 'Hủy' })).toBeNull()
		expect(screen.getAllByRole('button', { name: 'Duyệt' })).toHaveLength(1)
		expect(screen.getAllByRole('button', { name: 'Từ chối' })).toHaveLength(
			1
		)
	})

	it('offers no decision to an approver who cannot decide this one', async () => {
		await renderTab(kind, [kind.proposal({ canDecide: false })])
		await screen.findByText('Nguyễn Chỉ huy')

		expect(screen.queryByRole('button', { name: 'Duyệt' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Từ chối' })).toBeNull()
	})

	it('rejects with the reason the approver gives', async () => {
		const { requests } = await renderTab(kind, [kind.proposal()])

		fireEvent.click(await screen.findByRole('button', { name: 'Từ chối' }))
		const dialog = await screen.findByRole('dialog')
		expect(within(dialog).getByText(kind.rejectTitle)).toBeTruthy()
		fireEvent.change(within(dialog).getByRole('textbox'), {
			target: { value: 'Thiếu hồ sơ' }
		})
		fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))

		await waitFor(() =>
			expect(postCalls(requests).map((r) => [r.path, r.body])).toEqual([
				[`${kind.base}/1/reject`, { reason: 'Thiếu hồ sơ' }]
			])
		)
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
	})

	it('does not send a rejection without a reason', async () => {
		const { requests } = await renderTab(kind, [kind.proposal()])

		fireEvent.click(await screen.findByRole('button', { name: 'Từ chối' }))
		const dialog = await screen.findByRole('dialog')
		fireEvent.change(within(dialog).getByRole('textbox'), {
			target: { value: '   ' }
		})
		fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))

		expect(postCalls(requests)).toEqual([])
		expect(screen.getByRole('dialog')).toBeTruthy()
	})
})

describe('rank promotion detail', () => {
	const [rank] = kinds

	it('shows the target rank and effective date, and each trooper’s own rank and date where they differ', async () => {
		const p = rank.proposal()
		const [t] = p.troopers as Record<string, unknown>[]
		await renderTab(rank, [
			{
				...p,
				troopers: [
					t,
					{
						...t,
						id: 11,
						targetRank: 'Đại úy',
						effectiveDate: '2026-10-01',
						student: { id: 101, fullName: 'Phạm Văn B' }
					}
				]
			}
		])

		const sheet = await openDetail(rank)

		expect(within(sheet).getByText('Quân hàm đề xuất')).toBeTruthy()
		expect(within(sheet).getByText('Thượng úy')).toBeTruthy()
		expect(within(sheet).getByText('2026-09-01')).toBeTruthy()
		// Lê Văn A follows the header; Phạm Văn B overrides both.
		expect(within(sheet).getByText('Quân hàm: Thượng úy')).toBeTruthy()
		expect(
			within(sheet).getByText('Ngày hiệu lực: 2026-09-01')
		).toBeTruthy()
		expect(within(sheet).getByText('Quân hàm: Đại úy')).toBeTruthy()
		expect(
			within(sheet).getByText('Ngày hiệu lực: 2026-10-01')
		).toBeTruthy()
	})
})

describe('activity status detail', () => {
	const [, activity] = kinds

	it('shows a ranged status as a date range, and each trooper’s own range where it differs', async () => {
		const p = activity.proposal()
		const [t] = p.troopers as Record<string, unknown>[]
		await renderTab(activity, [
			{
				...p,
				troopers: [
					t,
					{
						...t,
						id: 11,
						startDate: '2026-09-10',
						student: { id: 101, fullName: 'Phạm Văn B' }
					}
				]
			}
		])

		const sheet = await openDetail(activity)

		expect(within(sheet).getByText('Nghỉ phép năm')).toBeTruthy()
		expect(within(sheet).getByText('Từ ngày')).toBeTruthy()
		expect(within(sheet).getByText('2026-09-01')).toBeTruthy()
		expect(within(sheet).getByText('Đến ngày')).toBeTruthy()
		expect(within(sheet).getByText('2026-09-30')).toBeTruthy()
		expect(within(sheet).queryByText('Ngày hiệu lực')).toBeNull()
		expect(within(sheet).getByText('2026-09-01 → 2026-09-30')).toBeTruthy()
		expect(within(sheet).getByText('2026-09-10 → 2026-09-30')).toBeTruthy()
	})

	it('shows a discharge as a single effective date', async () => {
		const p = activity.proposal({
			targetActivityStatus: 'discharged',
			effectiveDate: '2026-09-05',
			startDate: null,
			endDate: null
		})
		const [t] = p.troopers as Record<string, unknown>[]
		await renderTab(activity, [
			{
				...p,
				troopers: [
					t,
					{
						...t,
						id: 11,
						effectiveDate: '2026-09-07',
						student: { id: 101, fullName: 'Phạm Văn B' }
					}
				]
			}
		])

		const sheet = await openDetail(activity)

		expect(within(sheet).getByText('Xuất ngũ')).toBeTruthy()
		expect(within(sheet).getByText('Ngày hiệu lực')).toBeTruthy()
		expect(within(sheet).queryByText('Từ ngày')).toBeNull()
		expect(
			within(sheet).getByText('Ngày hiệu lực: 2026-09-05')
		).toBeTruthy()
		expect(
			within(sheet).getByText('Ngày hiệu lực: 2026-09-07')
		).toBeTruthy()
	})

	it('shows when a trooper was restored', async () => {
		const p = activity.proposal()
		const [t] = p.troopers as Record<string, unknown>[]
		await renderTab(activity, [
			{
				...p,
				troopers: [
					{
						...t,
						itemStatus: 'approved',
						appliedAt: '2026-09-02 08:00:00',
						revertedAt: '2026-10-01 08:00:00'
					}
				]
			}
		])

		const sheet = await openDetail(activity)

		expect(
			within(sheet).getByText('Đã khôi phục: 01/10/2026 15:00:00')
		).toBeTruthy()
	})
})
