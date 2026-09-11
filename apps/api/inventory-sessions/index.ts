import {
	InventorySessionDB,
	InventorySessionParams,
	InventorySessionStatus
} from '../schema/inventory-sessions'
import {
	InventorySessionExpectedAssetDB,
	InventorySessionExpectedAssetParams
} from '../schema/inventory-session-inspected-assets'
import {
	InventorySessionExpectedStockDB,
	InventorySessionExpectedStockParams
} from '../schema/inventory-session-expected-stocks'
import {
	InventorySessionScanDB,
	InventorySessionScanParams
} from '../schema/inventory-session-scans'
import {
	InventorySessionStockCountDB,
	InventorySessionStockCountParams
} from '../schema/inventory-session-stock-counts'
import { MaterialAssetDB } from '../schema/material-assets'
import {
	MaterialConditionName,
	MaterialStockDB
} from '../schema/material-stocks'

export interface RoomMaterialAsset extends MaterialAssetDB {
	materialTypeName: string
}

export interface RoomMaterialStock extends MaterialStockDB {
	materialTypeName: string
}

// What's needed to rebuild an InventorySessionChallengeAsset (see payload.ts)
// for a session's already-snapshotted expected assets - used to reconstruct
// the challenge QR when resuming a session instead of re-deriving it from
// material_assets' current (possibly since-changed) state.
export interface InventorySessionExpectedAssetWithType {
	serialNumber: string
	conditionSnapshot: MaterialConditionName
	materialTypeName: string
}

// Same idea as InventorySessionExpectedAssetWithType, for a session's
// already-snapshotted expected stock lines.
export interface InventorySessionExpectedStockWithType {
	materialTypeId: number
	materialTypeName: string
	condition: MaterialConditionName
	expectedQuantity: number
}

// Filters/pagination for the "Lịch sử kiểm kê" history sheet - `page` is
// 1-indexed, matching the convention `audit-logs/repo.ts` already uses.
export interface InventorySessionListQuery {
	status?: InventorySessionStatus
	from?: string
	to?: string
	page?: number
	pageSize?: number
}

export interface InventorySessionRepository {
	create(params: InventorySessionParams): Promise<InventorySessionDB>
	getOne(id: number): Promise<InventorySessionDB | undefined>
	markCompleted(id: number): Promise<InventorySessionDB>
	markReviewed(id: number): Promise<InventorySessionDB>
	markExpired(id: number): Promise<InventorySessionDB>

	// Set once a reviewed session's diff has been synced into
	// material_assets/material_stocks - see InventorySessionController.applyToInventory.
	markApplied(id: number): Promise<InventorySessionDB>

	// Flips any of a room's `in_progress` sessions older than `olderThanIso`
	// to `expired` - called opportunistically wherever "is there an open
	// session" actually matters, rather than on a schedule, since a
	// session's staleness is only ever relevant at the moment something
	// tries to act on it.
	expireStaleSessions(roomId: number, olderThanIso: string): Promise<void>

	// The room's still-open session, if any - lets the PC side resume
	// instead of starting a duplicate session after a reload/reboot.
	getOpenSessionForRoom(
		roomId: number
	): Promise<InventorySessionDB | undefined>

	// A room's sessions matching `query`, newest first, paginated - backs
	// the "Lịch sử kiểm kê" history sheet.
	listSessionsForRoom(
		roomId: number,
		query: InventorySessionListQuery
	): Promise<{ data: InventorySessionDB[]; total: number }>

	// The room's unitId, independent of whether it has any sessions - used
	// to authorize listSessionsForRoom even when a filtered/paginated query
	// returns zero rows for a room that does have sessions overall. Returns
	// undefined if the room doesn't exist.
	getRoomUnitId(roomId: number): Promise<number | undefined>

	// Serialized material_assets currently in a room - the pool a session's
	// "expected" snapshot is built from.
	getRoomMaterialAssets(roomId: number): Promise<RoomMaterialAsset[]>

	snapshotExpectedAssets(
		params: InventorySessionExpectedAssetParams[]
	): Promise<InventorySessionExpectedAssetDB[]>
	getExpectedAssets(
		sessionId: number
	): Promise<InventorySessionExpectedAssetDB[]>
	getExpectedAssetsWithType(
		sessionId: number
	): Promise<InventorySessionExpectedAssetWithType[]>

	insertScans(
		params: InventorySessionScanParams[]
	): Promise<InventorySessionScanDB[]>
	getScans(sessionId: number): Promise<InventorySessionScanDB[]>

	findAssetsBySerials(serials: string[]): Promise<MaterialAssetDB[]>

	// Room-scoped material_stocks rows - the pool a session's "expected"
	// stock snapshot is built from. Excludes unit-level stock (roomId: null)
	// automatically, since the query filters on an exact roomId match.
	getRoomMaterialStocks(roomId: number): Promise<RoomMaterialStock[]>

	snapshotExpectedStocks(
		params: InventorySessionExpectedStockParams[]
	): Promise<InventorySessionExpectedStockDB[]>
	getExpectedStocks(
		sessionId: number
	): Promise<InventorySessionExpectedStockDB[]>
	getExpectedStocksWithType(
		sessionId: number
	): Promise<InventorySessionExpectedStockWithType[]>

	insertStockCounts(
		params: InventorySessionStockCountParams[]
	): Promise<InventorySessionStockCountDB[]>
	getStockCounts(sessionId: number): Promise<InventorySessionStockCountDB[]>
}
