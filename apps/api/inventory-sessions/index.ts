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

export interface RoomMaterialAsset extends MaterialAssetDB {
	materialTypeName: string
}

export interface InventorySessionRepository {
	create(params: InventorySessionParams): Promise<InventorySessionDB>
	getOne(id: number): Promise<InventorySessionDB | undefined>
	markCompleted(id: number): Promise<InventorySessionDB>

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

	insertScans(
		params: InventorySessionScanParams[]
	): Promise<InventorySessionScanDB[]>
	getScans(sessionId: number): Promise<InventorySessionScanDB[]>

	findAssetsBySerials(serials: string[]): Promise<MaterialAssetDB[]>
}
