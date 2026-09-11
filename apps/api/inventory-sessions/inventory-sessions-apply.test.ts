import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventorySessionRepository } from '.'
import { InventorySessionExpectedAssetDB } from '../schema/inventory-session-inspected-assets'
import { InventorySessionScanDB } from '../schema/inventory-session-scans'
import { InventorySessionDB } from '../schema/inventory-sessions'
import { InventorySessionController } from './inventory-sessions-controller'

// applyToInventory writes through three cross-service repo singletons
// (materialAssetRepo, materialAssetEventRepo, materialStockRepo) imported
// directly by the controller module, mirroring the pattern in
// transfer-requests/controller.ts - they aren't part of the injected
// InventorySessionRepository, so they're mocked at the module level instead
// of via the fake-repo DI the rest of this service's tests use.
vi.mock('../materials/material-assets-repo', () => ({
	default: {
		update: vi.fn(),
		getOne: vi.fn()
	}
}))
vi.mock('../materials/material-asset-events-repo', () => ({
	default: {
		create: vi.fn()
	}
}))
vi.mock('../materials/material-stocks-repo', () => ({
	default: {
		getOne: vi.fn(),
		update: vi.fn(),
		create: vi.fn()
	}
}))

import materialAssetRepo from '../materials/material-assets-repo'
import materialAssetEventRepo from '../materials/material-asset-events-repo'
import materialStockRepo from '../materials/material-stocks-repo'

function makeSession(
	overrides: Partial<InventorySessionDB> = {}
): InventorySessionDB {
	return {
		id: 1,
		roomId: 10,
		unitId: 100,
		startedByUserId: 1,
		status: 'reviewed',
		completedAt: '2026-09-01 00:00:00',
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

function makeExpectedAsset(
	overrides: Partial<InventorySessionExpectedAssetDB> = {}
): InventorySessionExpectedAssetDB {
	return {
		id: 1,
		sessionId: 1,
		assetId: 1,
		serialNumber: 'SN-1',
		conditionSnapshot: 'good',
		createdAt: '',
		updatedAt: '',
		...overrides
	}
}

function makeScan(
	overrides: Partial<InventorySessionScanDB> = {}
): InventorySessionScanDB {
	return {
		id: 1,
		sessionId: 1,
		serialNumber: 'SN-1',
		assetId: 1,
		observedCondition: null,
		createdAt: '',
		updatedAt: '',
		...overrides
	}
}

beforeEach(() => {
	vi.clearAllMocks()
	;(materialAssetRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue(
		[]
	)
	;(
		materialAssetEventRepo.create as ReturnType<typeof vi.fn>
	).mockResolvedValue([])
})

describe('InventorySessionController.applyToInventory', () => {
	it('rejects when the caller is not authorized for the session unit', async () => {
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession())
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.applyToInventory(1, [999], 1, {})
		).rejects.toThrow()
		expect(repo.markApplied).not.toHaveBeenCalled()
	})

	it('rejects when the session is not yet reviewed', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(makeSession({ status: 'completed' }))
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.applyToInventory(1, [100], 1, {})
		).rejects.toThrow(/must be reviewed/)
		expect(repo.markApplied).not.toHaveBeenCalled()
	})

	it('rejects when the session has already been applied', async () => {
		const repo = makeFakeRepo({
			getOne: vi
				.fn()
				.mockResolvedValue(
					makeSession({ appliedAt: '2026-09-05 00:00:00' })
				)
		})
		const controller = new InventorySessionController(repo)

		await expect(
			controller.applyToInventory(1, [100], 1, {})
		).rejects.toThrow(/already been applied/)
		expect(repo.markApplied).not.toHaveBeenCalled()
	})

	it('marks a missing asset lost and logs a status_changed event', async () => {
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession()),
			getExpectedAssets: vi
				.fn()
				.mockResolvedValue([
					makeExpectedAsset({ serialNumber: 'SN-1' })
				]),
			getScans: vi.fn().mockResolvedValue([]),
			findAssetsBySerials: vi.fn().mockResolvedValue([
				{
					id: 1,
					serialNumber: 'SN-1',
					status: 'in_service',
					condition: 'good',
					roomId: 10,
					unitId: 100
				}
			]),
			markApplied: vi
				.fn()
				.mockResolvedValue(makeSession({ appliedAt: 'x' }))
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.applyToInventory(1, [100], 7, {})

		expect(result.missingApplied).toBe(1)
		expect(materialAssetRepo.update).toHaveBeenCalledWith([
			{ id: 1, updatePayload: { status: 'lost' } }
		])
		expect(materialAssetEventRepo.create).toHaveBeenCalledWith([
			expect.objectContaining({
				assetId: 1,
				eventType: 'status_changed',
				newValue: { status: 'lost' },
				actorUserId: 7
			})
		])
		expect(repo.markApplied).toHaveBeenCalledWith(1)
	})

	it('applies a condition change for a scanned asset', async () => {
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession()),
			getExpectedAssets: vi
				.fn()
				.mockResolvedValue([
					makeExpectedAsset({
						serialNumber: 'SN-1',
						conditionSnapshot: 'good'
					})
				]),
			getScans: vi
				.fn()
				.mockResolvedValue([
					makeScan({
						serialNumber: 'SN-1',
						observedCondition: 'damaged'
					})
				]),
			findAssetsBySerials: vi.fn().mockResolvedValue([
				{
					id: 1,
					serialNumber: 'SN-1',
					status: 'in_service',
					condition: 'good',
					roomId: 10,
					unitId: 100
				}
			]),
			markApplied: vi
				.fn()
				.mockResolvedValue(makeSession({ appliedAt: 'x' }))
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.applyToInventory(1, [100], 7, {})

		expect(result.conditionChangedApplied).toBe(1)
		expect(materialAssetRepo.update).toHaveBeenCalledWith([
			{ id: 1, updatePayload: { condition: 'damaged' } }
		])
	})

	it('only reassigns an extra asset serial when explicitly resolved to apply', async () => {
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession()),
			getExpectedAssets: vi.fn().mockResolvedValue([]),
			getScans: vi
				.fn()
				.mockResolvedValue([
					makeScan({
						serialNumber: 'SN-EXTRA',
						observedCondition: 'good'
					})
				]),
			findAssetsBySerials: vi.fn().mockResolvedValue([
				{
					id: 2,
					serialNumber: 'SN-EXTRA',
					status: 'in_service',
					condition: 'good',
					roomId: 5,
					unitId: 100
				}
			]),
			markApplied: vi
				.fn()
				.mockResolvedValue(makeSession({ appliedAt: 'x' }))
		})
		const controller = new InventorySessionController(repo)

		const unresolved = await controller.applyToInventory(1, [100], 7, {})
		expect(unresolved.extraAssetsApplied).toBe(0)
		expect(materialAssetRepo.update).not.toHaveBeenCalled()

		const resolved = await controller.applyToInventory(1, [100], 7, {
			assetResolutions: [{ serial: 'SN-EXTRA', action: 'apply' }]
		})
		expect(resolved.extraAssetsApplied).toBe(1)
		expect(materialAssetRepo.update).toHaveBeenCalledWith([
			{
				id: 2,
				updatePayload: { roomId: 10, unitId: 100, condition: 'good' }
			}
		])
	})

	it('flags an extra serial with no matching asset instead of writing anything', async () => {
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession()),
			getExpectedAssets: vi.fn().mockResolvedValue([]),
			getScans: vi
				.fn()
				.mockResolvedValue([
					makeScan({
						serialNumber: 'SN-UNKNOWN',
						observedCondition: 'good'
					})
				]),
			findAssetsBySerials: vi.fn().mockResolvedValue([]),
			markApplied: vi
				.fn()
				.mockResolvedValue(makeSession({ appliedAt: 'x' }))
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.applyToInventory(1, [100], 7, {
			assetResolutions: [{ serial: 'SN-UNKNOWN', action: 'apply' }]
		})

		expect(result.extraAssetsFlagged).toBe(1)
		expect(result.extraAssetsApplied).toBe(0)
		expect(materialAssetRepo.update).not.toHaveBeenCalled()
	})

	it('sets a short/over stock line to the observed quantity when resolved to apply', async () => {
		;(
			materialStockRepo.getOne as ReturnType<typeof vi.fn>
		).mockResolvedValue({
			id: 55,
			materialTypeId: 3,
			unitId: 100,
			roomId: 10,
			condition: 'good'
		})
		;(
			materialStockRepo.update as ReturnType<typeof vi.fn>
		).mockResolvedValue([])
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession()),
			getExpectedStocksWithType: vi.fn().mockResolvedValue([
				{
					materialTypeId: 3,
					condition: 'good',
					expectedQuantity: 10,
					materialTypeName: 'Rifle'
				}
			]),
			getStockCounts: vi.fn().mockResolvedValue([
				{
					id: 1,
					sessionId: 1,
					materialTypeId: 3,
					condition: 'good',
					observedQuantity: 7,
					createdAt: '',
					updatedAt: ''
				}
			]),
			markApplied: vi
				.fn()
				.mockResolvedValue(makeSession({ appliedAt: 'x' }))
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.applyToInventory(1, [100], 7, {
			stockResolutions: [
				{ materialTypeId: 3, condition: 'good', action: 'apply' }
			]
		})

		expect(result.stockShortOverApplied).toBe(1)
		expect(materialStockRepo.update).toHaveBeenCalledWith([
			{ id: 55, updatePayload: { quantity: 7 } }
		])
	})

	it('inserts a new stock row for an extra materialType/condition line resolved to apply', async () => {
		;(
			materialStockRepo.create as ReturnType<typeof vi.fn>
		).mockResolvedValue([])
		const repo = makeFakeRepo({
			getOne: vi.fn().mockResolvedValue(makeSession()),
			getExpectedStocksWithType: vi.fn().mockResolvedValue([]),
			getStockCounts: vi.fn().mockResolvedValue([
				{
					id: 1,
					sessionId: 1,
					materialTypeId: 9,
					condition: 'damaged',
					observedQuantity: 4,
					createdAt: '',
					updatedAt: ''
				}
			]),
			markApplied: vi
				.fn()
				.mockResolvedValue(makeSession({ appliedAt: 'x' }))
		})
		const controller = new InventorySessionController(repo)

		const result = await controller.applyToInventory(1, [100], 7, {
			stockResolutions: [
				{ materialTypeId: 9, condition: 'damaged', action: 'apply' }
			]
		})

		expect(result.stockExtraApplied).toBe(1)
		expect(materialStockRepo.create).toHaveBeenCalledWith([
			{
				materialTypeId: 9,
				unitId: 100,
				roomId: 10,
				condition: 'damaged',
				quantity: 4
			}
		])
	})
})
