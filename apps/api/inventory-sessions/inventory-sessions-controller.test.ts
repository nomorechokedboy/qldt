import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	InventorySessionExpectedStockWithType,
	InventorySessionRepository,
	RoomMaterialAsset,
	RoomMaterialStock
} from '.'
import { InventorySessionExpectedAssetDB } from '../schema/inventory-session-inspected-assets'
import { InventorySessionScanDB } from '../schema/inventory-session-scans'
import { InventorySessionDB } from '../schema/inventory-sessions'
import { InventorySessionController } from './inventory-sessions-controller'
import { buildResultsPayload } from './payload'

// Controller tests exercise the authorization and status-transition guards
// called out in docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md's
// and docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md's
// testing plans. The repo is a hand-rolled fake rather than a real DB - these
// guards live entirely in the controller, so a fake that returns canned rows
// is enough to prove them without spinning up Postgres.

function makeSession(
	overrides: Partial<InventorySessionDB> = {}
): InventorySessionDB {
	return {
		id: 1,
		roomId: 10,
		unitId: 100,
		startedByUserId: 1,
		status: 'in_progress',
		completedAt: null,
		appliedAt: null,
		createdAt: '',
		updatedAt: '',
		...overrides
	}
}

function makeFakeRepo(
	overrides: Partial<InventorySessionRepository> = {}
): InventorySessionRepository {
	return {
		create: vi.fn(),
		getOne: vi.fn(),
		markCompleted: vi.fn(),
		markReviewed: vi.fn(),
		markExpired: vi.fn(),
		markApplied: vi.fn(),
		expireStaleSessions: vi.fn().mockResolvedValue(undefined),
		getOpenSessionForRoom: vi.fn(),
		listSessionsForRoom: vi.fn().mockResolvedValue({ data: [], total: 0 }),
		getRoomUnitId: vi.fn().mockResolvedValue(100),
		getMaterialTypeNamesByIds: vi.fn().mockResolvedValue(new Map()),
		getRoomMaterialAssets: vi.fn().mockResolvedValue([]),
		snapshotExpectedAssets: vi.fn(),
		getExpectedAssets: vi.fn().mockResolvedValue([]),
		getExpectedAssetsWithType: vi.fn(),
		insertScans: vi.fn(),
		getScans: vi.fn().mockResolvedValue([]),
		findAssetsBySerials: vi.fn().mockResolvedValue([]),
		getRoomMaterialStocks: vi.fn().mockResolvedValue([]),
		snapshotExpectedStocks: vi.fn(),
		getExpectedStocks: vi.fn().mockResolvedValue([]),
		getExpectedStocksWithType: vi.fn().mockResolvedValue([]),
		insertStockCounts: vi.fn(),
		getStockCounts: vi.fn().mockResolvedValue([]),
		...overrides
	}
}

describe('InventorySessionController.createChallenge', () => {
	it('rejects a room whose assets belong to a unit outside validUnitIds', async () => {
		const assets: RoomMaterialAsset[] = [
			{
				id: 1,
				materialTypeId: 1,
				unitId: 999,
				roomId: 10,
				serialNumber: 'A1',
				condition: 'good',
				status: 'in_service',
				assignedTrooperId: null,
				createdAt: '',
				updatedAt: '',
				materialTypeName: 'AK'
			}
		]
		const repo = makeFakeRepo({
			getRoomMaterialAssets: vi.fn().mockResolvedValue(assets)
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.createChallenge({
				roomId: 10,
				startedByUserId: 1,
				validUnitIds: [1, 2, 3]
			})
		).rejects.toThrow()

		expect(repo.create).not.toHaveBeenCalled()
	})

	it('rejects a room with no serialized assets and no bulk stock to reconcile', async () => {
		const repo = makeFakeRepo({
			getRoomMaterialAssets: vi.fn().mockResolvedValue([]),
			getRoomMaterialStocks: vi.fn().mockResolvedValue([])
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.createChallenge({
				roomId: 10,
				startedByUserId: 1,
				validUnitIds: [100]
			})
		).rejects.toThrow()
	})

	it('creates a session for a room with only bulk stock and no serialized assets', async () => {
		const stocks: RoomMaterialStock[] = [
			{
				id: 1,
				materialTypeId: 5,
				unitId: 100,
				roomId: 10,
				quantity: 200,
				condition: 'good',
				createdAt: '',
				updatedAt: '',
				materialTypeName: 'Đạn AK'
			}
		]
		const repo = makeFakeRepo({
			getRoomMaterialAssets: vi.fn().mockResolvedValue([]),
			getRoomMaterialStocks: vi.fn().mockResolvedValue(stocks),
			create: vi
				.fn()
				.mockResolvedValue(makeSession({ id: 5, unitId: 100 }))
		})
		const controller = new InventorySessionController(repo)

		const payload = await controller.createChallenge({
			roomId: 10,
			startedByUserId: 1,
			validUnitIds: [100]
		})

		expect(payload.expected).toEqual([])
		expect(payload.expectedStocks).toEqual([
			{
				materialTypeId: 5,
				materialTypeName: 'Đạn AK',
				condition: 'good',
				expectedQuantity: 200
			}
		])
		expect(repo.create).toHaveBeenCalledWith(
			expect.objectContaining({ roomId: 10, unitId: 100 })
		)
		expect(repo.snapshotExpectedStocks).toHaveBeenCalledWith([
			{
				sessionId: 5,
				materialTypeId: 5,
				condition: 'good',
				expectedQuantity: 200
			}
		])
	})
})

describe('InventorySessionController.getOpenChallenge', () => {
	it('rejects a room whose open session belongs to a unit outside validUnitIds', async () => {
		const repo = makeFakeRepo({
			getOpenSessionForRoom: vi
				.fn()
				.mockResolvedValue(makeSession({ unitId: 999 }))
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.getOpenChallenge(10, [1, 2, 3])
		).rejects.toThrow()
	})

	it('returns null when the room has no open session', async () => {
		const repo = makeFakeRepo({
			getOpenSessionForRoom: vi.fn().mockResolvedValue(undefined)
		})
		const controller = new InventorySessionController(repo)

		await expect(controller.getOpenChallenge(10, [100])).resolves.toBeNull()
	})

	it('sweeps stale sessions for the room before checking for an open one', async () => {
		const callOrder: string[] = []
		const repo = makeFakeRepo({
			expireStaleSessions: vi.fn().mockImplementation(async () => {
				callOrder.push('expire')
			}),
			getOpenSessionForRoom: vi.fn().mockImplementation(async () => {
				callOrder.push('getOpen')
				return undefined
			})
		})
		const controller = new InventorySessionController(repo)

		await controller.getOpenChallenge(10, [100])

		expect(repo.expireStaleSessions).toHaveBeenCalledWith(
			10,
			expect.any(String)
		)
		expect(callOrder).toEqual(['expire', 'getOpen'])
	})
})

describe('InventorySessionController.listSessionsForRoom', () => {
	it('rejects a room whose unit is outside validUnitIds even when a filtered page is empty', async () => {
		const repo = makeFakeRepo({
			getRoomUnitId: vi.fn().mockResolvedValue(999),
			listSessionsForRoom: vi
				.fn()
				.mockResolvedValue({ data: [], total: 0 })
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.listSessionsForRoom(10, [1, 2, 3], {})
		).rejects.toThrow()
		expect(repo.listSessionsForRoom).not.toHaveBeenCalled()
	})

	it('rejects a room that does not exist', async () => {
		const repo = makeFakeRepo({
			getRoomUnitId: vi.fn().mockResolvedValue(undefined)
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.listSessionsForRoom(10, [100], {})
		).rejects.toThrow()
	})

	it('returns session summaries and total for an authorized room', async () => {
		const repo = makeFakeRepo({
			getRoomUnitId: vi.fn().mockResolvedValue(100),
			listSessionsForRoom: vi.fn().mockResolvedValue({
				data: [
					makeSession({ id: 2, unitId: 100, status: 'reviewed' }),
					makeSession({ id: 1, unitId: 100, status: 'in_progress' })
				],
				total: 2
			})
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.listSessionsForRoom(10, [100], {})

		expect(result.total).toBe(2)
		expect(result.data).toHaveLength(2)
		expect(result.data[0]).toMatchObject({ id: 2, status: 'reviewed' })
		expect(result.data[1]).toMatchObject({ id: 1, status: 'in_progress' })
	})

	it('passes the query filters through to the repo', async () => {
		const repo = makeFakeRepo({
			getRoomUnitId: vi.fn().mockResolvedValue(100)
		})
		const controller = new InventorySessionController(repo)
		const query = { status: 'reviewed' as const, page: 2, pageSize: 10 }

		await controller.listSessionsForRoom(10, [100], query)

		expect(repo.listSessionsForRoom).toHaveBeenCalledWith(10, query)
	})
})

describe('InventorySessionController.submitResults', () => {
	it('rejects a tampered signature before touching the repo', async () => {
		const repo = makeFakeRepo()
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[{ serial: 'A1', observedCondition: 'good' }],
			[]
		)
		const tampered = {
			...results,
			results: [{ serial: 'A1', observedCondition: 'damaged' as const }]
		}

		await expect(controller.submitResults(tampered)).rejects.toThrow()
		expect(repo.getOne).not.toHaveBeenCalled()
	})

	it('rejects a session that is not in_progress (replay after completion)', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'completed' }))
		})
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[{ serial: 'A1', observedCondition: 'good' }],
			[]
		)

		await expect(controller.submitResults(results)).rejects.toThrow(
			/already completed/
		)
		expect(repo.insertScans).not.toHaveBeenCalled()
		expect(repo.markCompleted).not.toHaveBeenCalled()
	})

	it('rejects a replay against an already-reviewed session', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'reviewed' }))
		})
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[{ serial: 'A1', observedCondition: 'good' }],
			[]
		)

		await expect(controller.submitResults(results)).rejects.toThrow(
			/already reviewed/
		)
	})

	it('rejects and expires an in_progress session older than 4 hours', async () => {
		const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
		const createdAt = fiveHoursAgo
			.toISOString()
			.slice(0, 19)
			.replace('T', ' ')
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(
					makeSession({ status: 'in_progress', createdAt })
				)
		})
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[{ serial: 'A1', observedCondition: 'good' }],
			[]
		)

		await expect(controller.submitResults(results)).rejects.toThrow(
			/expired/
		)
		expect(repo.markExpired).toHaveBeenCalledWith(1)
		expect(repo.insertScans).not.toHaveBeenCalled()
		expect(repo.markCompleted).not.toHaveBeenCalled()
	})

	it('accepts a genuine payload against an in_progress session', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'in_progress' })),
			markCompleted: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'completed' }))
		})
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[{ serial: 'A1', observedCondition: 'good' }],
			[]
		)

		const review = await controller.submitResults(results)

		expect(review.session.status).toBe('completed')
		expect(repo.insertScans).toHaveBeenCalledTimes(1)
		expect(repo.markCompleted).toHaveBeenCalledWith(1)
		expect(review.stockDiff).toEqual([])
	})

	it('writes stock counts and includes them in the returned stock diff', async () => {
		const expectedStocks: InventorySessionExpectedStockWithType[] = [
			{
				materialTypeId: 5,
				materialTypeName: 'Đạn AK',
				condition: 'good',
				expectedQuantity: 200
			}
		]
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'in_progress' })),
			markCompleted: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'completed' })),
			getExpectedStocksWithType: vi
				.fn()
				.mockResolvedValue(expectedStocks),
			getStockCounts: vi.fn().mockResolvedValue([
				{
					id: 1,
					sessionId: 1,
					materialTypeId: 5,
					condition: 'good',
					observedQuantity: 195,
					createdAt: '',
					updatedAt: ''
				}
			])
		})
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[],
			[{ materialTypeId: 5, condition: 'good', observedQuantity: 195 }]
		)

		const review = await controller.submitResults(results)

		expect(repo.insertStockCounts).toHaveBeenCalledWith([
			{
				sessionId: 1,
				materialTypeId: 5,
				condition: 'good',
				observedQuantity: 195
			}
		])
		expect(review.stockDiff).toEqual([
			{
				materialTypeId: 5,
				condition: 'good',
				status: 'short',
				expectedQuantity: 200,
				observedQuantity: 195,
				materialTypeName: 'Đạn AK'
			}
		])
	})

	it('rejects a v1-shaped payload (missing stockResults / wrong v) before touching the repo', async () => {
		const repo = makeFakeRepo()
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(
			1,
			[{ serial: 'A1', observedCondition: 'good' }],
			[]
		)
		// Simulate a v1 client: no `stockResults` field and the old version
		// number, with `sig` left as-is (a real v1 client's sig would also be
		// computed differently, but the version/shape guard must reject this
		// before the payload ever reaches verifyResultsPayload's signature
		// check or canonicalResults' `.map()` over `stockResults`).
		const v1Shaped = {
			v: 1,
			sid: results.sid,
			results: results.results,
			sig: results.sig
		} as unknown as Parameters<typeof controller.submitResults>[0]

		await expect(controller.submitResults(v1Shaped)).rejects.toThrow(
			/incompatible app version/
		)
		expect(repo.getOne).not.toHaveBeenCalled()
	})
})

describe('InventorySessionController.markReviewed', () => {
	it('rejects a session that has not been completed yet', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(
					makeSession({ status: 'in_progress', unitId: 100 })
				)
		})
		const controller = new InventorySessionController(repo)

		await expect(controller.markReviewed(1, [100])).rejects.toThrow(
			/must be completed/
		)
		expect(repo.markReviewed).not.toHaveBeenCalled()
	})

	it('rejects marking an already-reviewed session reviewed again', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(
					makeSession({ status: 'reviewed', unitId: 100 })
				)
		})
		const controller = new InventorySessionController(repo)

		await expect(controller.markReviewed(1, [100])).rejects.toThrow(
			/must be completed/
		)
	})

	it('rejects a caller without access to the session unit', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(
					makeSession({ status: 'completed', unitId: 999 })
				)
		})
		const controller = new InventorySessionController(repo)

		await expect(controller.markReviewed(1, [1, 2, 3])).rejects.toThrow()
		expect(repo.markReviewed).not.toHaveBeenCalled()
	})

	it('transitions a completed session to reviewed', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(
					makeSession({ status: 'completed', unitId: 100 })
				),
			markReviewed: vi
				.fn()
				.mockResolvedValue(
					makeSession({ status: 'reviewed', unitId: 100 })
				)
		})
		const controller = new InventorySessionController(repo)

		const review = await controller.markReviewed(1, [100])

		expect(review.session.status).toBe('reviewed')
		expect(repo.markReviewed).toHaveBeenCalledWith(1)
	})
})
