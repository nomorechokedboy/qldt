import { and, desc, eq, inArray } from 'drizzle-orm'
import {
	InventorySessionExpectedAssetWithType,
	InventorySessionRepository,
	RoomMaterialAsset
} from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	inventorySessions,
	InventorySessionDB,
	InventorySessionParams
} from '../schema/inventory-sessions'
import {
	inventorySessionExpectedAssets,
	InventorySessionExpectedAssetDB,
	InventorySessionExpectedAssetParams
} from '../schema/inventory-session-inspected-assets'
import {
	inventorySessionScans,
	InventorySessionScanDB,
	InventorySessionScanParams
} from '../schema/inventory-session-scans'
import { materialAssets, MaterialAssetDB } from '../schema/material-assets'
import { materialTypes } from '../schema/material-types'
import { handleDatabaseErr } from '../utils'

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

	getOpenSessionForRoom(
		roomId: number
	): Promise<InventorySessionDB | undefined> {
		return this.db.query.inventorySessions
			.findFirst({
				where: and(
					eq(inventorySessions.roomId, roomId),
					eq(inventorySessions.status, 'in_progress')
				)
			})
			.catch(handleDatabaseErr)
	}

	listSessionsForRoom(roomId: number): Promise<InventorySessionDB[]> {
		return this.db.query.inventorySessions
			.findMany({
				where: eq(inventorySessions.roomId, roomId),
				orderBy: desc(inventorySessions.createdAt)
			})
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
}

const inventorySessionRepo = new repo(orm)

export default inventorySessionRepo
