import { and, count, desc, eq, gte, inArray, lt, lte, SQL } from 'drizzle-orm'
import {
	InventorySessionExpectedStockWithType,
	InventorySessionExpectedAssetWithType,
	InventorySessionListQuery,
	InventorySessionRepository,
	RoomMaterialAsset,
	RoomMaterialStock
} from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	inventorySessions,
	InventorySessionDB,
	InventorySessionParams
} from '../schema/inventory-sessions'
import { rooms } from '../schema/rooms'
import {
	inventorySessionExpectedAssets,
	InventorySessionExpectedAssetDB,
	InventorySessionExpectedAssetParams
} from '../schema/inventory-session-inspected-assets'
import {
	inventorySessionExpectedStocks,
	InventorySessionExpectedStockDB,
	InventorySessionExpectedStockParams
} from '../schema/inventory-session-expected-stocks'
import {
	inventorySessionScans,
	InventorySessionScanDB,
	InventorySessionScanParams
} from '../schema/inventory-session-scans'
import {
	inventorySessionStockCounts,
	InventorySessionStockCountDB,
	InventorySessionStockCountParams
} from '../schema/inventory-session-stock-counts'
import { materialAssets, MaterialAssetDB } from '../schema/material-assets'
import { materialStocks } from '../schema/material-stocks'
import { materialTypes } from '../schema/material-types'
import { handleDatabaseErr } from '../utils'

const DEFAULT_HISTORY_PAGE_SIZE = 10

class repo implements InventorySessionRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: InventorySessionParams): Promise<InventorySessionDB> {
		return this.db
			.insert(inventorySessions)
			.values(params)
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	getOne(id: number): Promise<InventorySessionDB | undefined> {
		return this.db.query.inventorySessions
			.findFirst({ where: eq(inventorySessions.id, id) })
			.catch(handleDatabaseErr)
	}

	markCompleted(id: number): Promise<InventorySessionDB> {
		return this.db
			.update(inventorySessions)
			.set({ status: 'completed', completedAt: new Date().toISOString() })
			.where(eq(inventorySessions.id, id))
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	markReviewed(id: number): Promise<InventorySessionDB> {
		return this.db
			.update(inventorySessions)
			.set({ status: 'reviewed' })
			.where(eq(inventorySessions.id, id))
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	markExpired(id: number): Promise<InventorySessionDB> {
		return this.db
			.update(inventorySessions)
			.set({ status: 'expired' })
			.where(eq(inventorySessions.id, id))
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	markApplied(id: number): Promise<InventorySessionDB> {
		return this.db
			.update(inventorySessions)
			.set({ appliedAt: new Date().toISOString() })
			.where(eq(inventorySessions.id, id))
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	expireStaleSessions(roomId: number, olderThanIso: string): Promise<void> {
		return this.db
			.update(inventorySessions)
			.set({ status: 'expired' })
			.where(
				and(
					eq(inventorySessions.roomId, roomId),
					eq(inventorySessions.status, 'in_progress'),
					lt(inventorySessions.createdAt, olderThanIso)
				)
			)
			.then(() => undefined)
			.catch(handleDatabaseErr)
	}

	getOpenSessionForRoom(
		roomId: number
	): Promise<InventorySessionDB | undefined> {
		return this.db.query.inventorySessions
			.findFirst({
				where: and(
					eq(inventorySessions.roomId, roomId),
					eq(inventorySessions.status, 'in_progress')
				),
				orderBy: desc(inventorySessions.createdAt)
			})
			.catch(handleDatabaseErr)
	}

	listSessionsForRoom(
		roomId: number,
		query: InventorySessionListQuery
	): Promise<{ data: InventorySessionDB[]; total: number }> {
		const conditions: SQL[] = [eq(inventorySessions.roomId, roomId)]
		if (query.status !== undefined) {
			conditions.push(eq(inventorySessions.status, query.status))
		}
		if (query.from !== undefined) {
			conditions.push(gte(inventorySessions.createdAt, query.from))
		}
		if (query.to !== undefined) {
			conditions.push(lte(inventorySessions.createdAt, query.to))
		}
		const where = and(...conditions)

		const page = query.page && query.page > 0 ? query.page : 1
		const pageSize =
			query.pageSize && query.pageSize > 0
				? query.pageSize
				: DEFAULT_HISTORY_PAGE_SIZE

		return Promise.all([
			this.db.query.inventorySessions.findMany({
				where,
				orderBy: desc(inventorySessions.createdAt),
				limit: pageSize,
				offset: (page - 1) * pageSize
			}),
			this.db
				.select({ total: count() })
				.from(inventorySessions)
				.where(where)
		])
			.then(([data, totalResult]) => ({
				data,
				total: totalResult[0]?.total ?? 0
			}))
			.catch(handleDatabaseErr)
	}

	getRoomUnitId(roomId: number): Promise<number | undefined> {
		return this.db.query.rooms
			.findFirst({ where: eq(rooms.id, roomId) })
			.then((room) => room?.unitId)
			.catch(handleDatabaseErr)
	}

	getMaterialTypeNamesByIds(ids: number[]): Promise<Map<number, string>> {
		if (ids.length === 0) return Promise.resolve(new Map())
		return this.db
			.select({ id: materialTypes.id, name: materialTypes.name })
			.from(materialTypes)
			.where(inArray(materialTypes.id, ids))
			.then((rows) => new Map(rows.map((r) => [r.id, r.name])))
			.catch(handleDatabaseErr)
	}

	getRoomMaterialAssets(roomId: number): Promise<RoomMaterialAsset[]> {
		return this.db
			.select({
				id: materialAssets.id,
				materialTypeId: materialAssets.materialTypeId,
				unitId: materialAssets.unitId,
				roomId: materialAssets.roomId,
				serialNumber: materialAssets.serialNumber,
				condition: materialAssets.condition,
				status: materialAssets.status,
				assignedTrooperId: materialAssets.assignedTrooperId,
				createdAt: materialAssets.createdAt,
				updatedAt: materialAssets.updatedAt,
				materialTypeName: materialTypes.name
			})
			.from(materialAssets)
			.innerJoin(
				materialTypes,
				eq(materialAssets.materialTypeId, materialTypes.id)
			)
			.where(eq(materialAssets.roomId, roomId))
			.catch(handleDatabaseErr) as unknown as Promise<RoomMaterialAsset[]>
	}

	snapshotExpectedAssets(
		params: InventorySessionExpectedAssetParams[]
	): Promise<InventorySessionExpectedAssetDB[]> {
		if (params.length === 0) return Promise.resolve([])
		return this.db
			.insert(inventorySessionExpectedAssets)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	getExpectedAssets(
		sessionId: number
	): Promise<InventorySessionExpectedAssetDB[]> {
		return this.db.query.inventorySessionExpectedAssets
			.findMany({
				where: eq(inventorySessionExpectedAssets.sessionId, sessionId)
			})
			.catch(handleDatabaseErr)
	}

	getExpectedAssetsWithType(
		sessionId: number
	): Promise<InventorySessionExpectedAssetWithType[]> {
		return this.db
			.select({
				serialNumber: inventorySessionExpectedAssets.serialNumber,
				conditionSnapshot:
					inventorySessionExpectedAssets.conditionSnapshot,
				materialTypeName: materialTypes.name
			})
			.from(inventorySessionExpectedAssets)
			.innerJoin(
				materialAssets,
				eq(inventorySessionExpectedAssets.assetId, materialAssets.id)
			)
			.innerJoin(
				materialTypes,
				eq(materialAssets.materialTypeId, materialTypes.id)
			)
			.where(eq(inventorySessionExpectedAssets.sessionId, sessionId))
			.catch(handleDatabaseErr) as unknown as Promise<
			InventorySessionExpectedAssetWithType[]
		>
	}

	insertScans(
		params: InventorySessionScanParams[]
	): Promise<InventorySessionScanDB[]> {
		if (params.length === 0) return Promise.resolve([])
		return this.db
			.insert(inventorySessionScans)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	getScans(sessionId: number): Promise<InventorySessionScanDB[]> {
		return this.db.query.inventorySessionScans
			.findMany({ where: eq(inventorySessionScans.sessionId, sessionId) })
			.catch(handleDatabaseErr)
	}

	findAssetsBySerials(serials: string[]): Promise<MaterialAssetDB[]> {
		if (serials.length === 0) return Promise.resolve([])
		return this.db.query.materialAssets
			.findMany({ where: inArray(materialAssets.serialNumber, serials) })
			.catch(handleDatabaseErr)
	}

	getRoomMaterialStocks(roomId: number): Promise<RoomMaterialStock[]> {
		return this.db
			.select({
				id: materialStocks.id,
				materialTypeId: materialStocks.materialTypeId,
				unitId: materialStocks.unitId,
				roomId: materialStocks.roomId,
				quantity: materialStocks.quantity,
				condition: materialStocks.condition,
				createdAt: materialStocks.createdAt,
				updatedAt: materialStocks.updatedAt,
				materialTypeName: materialTypes.name
			})
			.from(materialStocks)
			.innerJoin(
				materialTypes,
				eq(materialStocks.materialTypeId, materialTypes.id)
			)
			.where(eq(materialStocks.roomId, roomId))
			.catch(handleDatabaseErr) as unknown as Promise<RoomMaterialStock[]>
	}

	snapshotExpectedStocks(
		params: InventorySessionExpectedStockParams[]
	): Promise<InventorySessionExpectedStockDB[]> {
		if (params.length === 0) return Promise.resolve([])
		return this.db
			.insert(inventorySessionExpectedStocks)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	getExpectedStocks(
		sessionId: number
	): Promise<InventorySessionExpectedStockDB[]> {
		return this.db.query.inventorySessionExpectedStocks
			.findMany({
				where: eq(inventorySessionExpectedStocks.sessionId, sessionId)
			})
			.catch(handleDatabaseErr)
	}

	getExpectedStocksWithType(
		sessionId: number
	): Promise<InventorySessionExpectedStockWithType[]> {
		return this.db
			.select({
				materialTypeId: inventorySessionExpectedStocks.materialTypeId,
				condition: inventorySessionExpectedStocks.condition,
				expectedQuantity:
					inventorySessionExpectedStocks.expectedQuantity,
				materialTypeName: materialTypes.name
			})
			.from(inventorySessionExpectedStocks)
			.innerJoin(
				materialTypes,
				eq(
					inventorySessionExpectedStocks.materialTypeId,
					materialTypes.id
				)
			)
			.where(eq(inventorySessionExpectedStocks.sessionId, sessionId))
			.catch(handleDatabaseErr) as unknown as Promise<
			InventorySessionExpectedStockWithType[]
		>
	}

	insertStockCounts(
		params: InventorySessionStockCountParams[]
	): Promise<InventorySessionStockCountDB[]> {
		if (params.length === 0) return Promise.resolve([])
		return this.db
			.insert(inventorySessionStockCounts)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	getStockCounts(sessionId: number): Promise<InventorySessionStockCountDB[]> {
		return this.db.query.inventorySessionStockCounts
			.findMany({
				where: eq(inventorySessionStockCounts.sessionId, sessionId)
			})
			.catch(handleDatabaseErr)
	}
}

const inventorySessionRepo = new repo(orm)

export default inventorySessionRepo
