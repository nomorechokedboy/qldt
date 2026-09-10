import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventorySessionRepository, RoomMaterialAsset } from '.'
import { InventorySessionExpectedAssetDB } from '../schema/inventory-session-inspected-assets'
import { InventorySessionScanDB } from '../schema/inventory-session-scans'
import { InventorySessionDB } from '../schema/inventory-sessions'
import { InventorySessionController } from './inventory-sessions-controller'
import { buildResultsPayload } from './payload'

// Controller tests exercise the authorization and status-transition guards
// called out in docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md's
// testing plan. The repo is a hand-rolled fake rather than a real DB - these
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
		getOpenSessionForRoom: vi.fn(),
		listSessionsForRoom: vi.fn().mockResolvedValue([]),
		getRoomMaterialAssets: vi.fn(),
		snapshotExpectedAssets: vi.fn(),
		getExpectedAssets: vi.fn().mockResolvedValue([]),
		getExpectedAssetsWithType: vi.fn(),
		insertScans: vi.fn(),
		getScans: vi.fn().mockResolvedValue([]),
		findAssetsBySerials: vi.fn().mockResolvedValue([]),
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

	it('rejects a room with no serialized assets to reconcile', async () => {
		const repo = makeFakeRepo({
			getRoomMaterialAssets: vi.fn().mockResolvedValue([])
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
})

describe('InventorySessionController.listSessionsForRoom', () => {
	it('returns an empty list without an authorization check when the room has no sessions', async () => {
		const repo = makeFakeRepo({
			listSessionsForRoom: vi.fn().mockResolvedValue([])
		})
		const controller = new InventorySessionController(repo)

		await expect(controller.listSessionsForRoom(10, [])).resolves.toEqual(
			[]
		)
	})

	it('rejects a room whose sessions belong to a unit outside validUnitIds', async () => {
		const repo = makeFakeRepo({
			listSessionsForRoom: vi
				.fn()
				.mockResolvedValue([makeSession({ unitId: 999 })])
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.listSessionsForRoom(10, [1, 2, 3])
		).rejects.toThrow()
	})

	it('returns session summaries for an authorized room', async () => {
		const repo = makeFakeRepo({
			listSessionsForRoom: vi
				.fn()
				.mockResolvedValue([
					makeSession({ id: 2, unitId: 100, status: 'reviewed' }),
					makeSession({ id: 1, unitId: 100, status: 'in_progress' })
				])
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.listSessionsForRoom(10, [100])

		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ id: 2, status: 'reviewed' })
		expect(result[1]).toMatchObject({ id: 1, status: 'in_progress' })
	})
})

describe('InventorySessionController.submitResults', () => {
	it('rejects a tampered signature before touching the repo', async () => {
		const repo = makeFakeRepo()
		const controller = new InventorySessionController(repo)

		const results = buildResultsPayload(1, [
			{ serial: 'A1', observedCondition: 'good' }
		])
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

		const results = buildResultsPayload(1, [
			{ serial: 'A1', observedCondition: 'good' }
		])

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

		const results = buildResultsPayload(1, [
			{ serial: 'A1', observedCondition: 'good' }
		])

		await expect(controller.submitResults(results)).rejects.toThrow(
			/already reviewed/
		)
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

		const results = buildResultsPayload(1, [
			{ serial: 'A1', observedCondition: 'good' }
		])

		const review = await controller.submitResults(results)

		expect(review.session.status).toBe('completed')
		expect(repo.insertScans).toHaveBeenCalledTimes(1)
		expect(repo.markCompleted).toHaveBeenCalledWith(1)
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
