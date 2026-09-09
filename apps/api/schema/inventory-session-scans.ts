import { InferInsertModel, InferSelectModel, relations, sql } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { inventorySessions } from './inventory-sessions'
import { materialAssets } from './material-assets'
import { MaterialConditionName } from './material-stocks'

export const inventorySessionScans = sqlite.sqliteTable(
	'inventory_session_scans',
	{
		...baseSchema,

		sessionId: sqlite
			.int()
			.notNull()
			.references(() => inventorySessions.id),

		/**
		 * Raw value obtained from the physical QR.
		 *
		 * This is intentionally NOT nullable and is the
		 * physical identity that was actually observed.
		 */
		serialNumber: sqlite.text().notNull(),

		/**
		 * Nullable because an unexpected physical asset may
		 * not exist in material_assets.
		 */
		assetId: sqlite.int().references(() => materialAssets.id),

		observedCondition: sqlite.text().$type<MaterialConditionName>(),

		scannedAt: sqlite
			.text()
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`)
	},
	(t) => [
		sqlite.index('inventory_session_scans_session_id_idx').on(t.sessionId),

		sqlite
			.index('inventory_session_scans_serial_number_idx')
			.on(t.serialNumber),

		sqlite.index('inventory_session_scans_asset_id_idx').on(t.assetId)
	]
)

export const inventorySessionScansRelations = relations(
	inventorySessionScans,
	({ one }) => ({
		session: one(inventorySessions, {
			fields: [inventorySessionScans.sessionId],
			references: [inventorySessions.id]
		}),

		asset: one(materialAssets, {
			fields: [inventorySessionScans.assetId],
			references: [materialAssets.id]
		})
	})
)

export type InventorySessionScanDB = InferSelectModel<
	typeof inventorySessionScans
>

export type InventorySessionScanParams = InferInsertModel<
	typeof inventorySessionScans
>
