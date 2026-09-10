import {
	InventorySessionDB,
	InventorySessionParams
} from '../schema/inventory-sessions'
import {
	InventorySessionExpectedAssetDB,
	InventorySessionExpectedAssetParams
} from '../schema/inventory-session-inspected-assets'
import {
	InventorySessionScanDB,
	InventorySessionScanParams
} from '../schema/inventory-session-scans'
import { MaterialAssetDB } from '../schema/material-assets'
import { MaterialConditionName } from '../schema/material-stocks'

export interface RoomMaterialAsset extends MaterialAssetDB {
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

export interface InventorySessionRepository {
	create(params: InventorySessionParams): Promise<InventorySessionDB>
	getOne(id: number): Promise<InventorySessionDB | undefined>
	markCompleted(id: number): Promise<InventorySessionDB>
	markReviewed(id: number): Promise<InventorySessionDB>
	markExpired(id: number): Promise<InventorySessionDB>

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

	// All of a room's sessions (any status), newest first - backs the
	// "Lịch sử kiểm kê" history sheet.
	listSessionsForRoom(roomId: number): Promise<InventorySessionDB[]>

	// Serialized material_assets currently in a room - the pool a session's
	// "expected" snapshot is built from. Scoped to material_assets only for
	// this iteration (materials with a serial); material_stocks (bulk,
	// non-serialized) is out of scope.
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
}
