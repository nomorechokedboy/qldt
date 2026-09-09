import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { inventorySessions } from './inventory-sessions'
import { materialAssets } from './material-assets'
import { MaterialConditionName } from './material-stocks'

export const inventorySessionExpectedAssets = sqlite.sqliteTable(
	'inventory_session_expected_assets',
	{
		...baseSchema,

		sessionId: sqlite
			.int()
			.notNull()
			.references(() => inventorySessions.id),

		assetId: sqlite
			.int()
			.notNull()
			.references(() => materialAssets.id),

		serialNumber: sqlite.text().notNull(),

		conditionSnapshot: sqlite
			.text()
			.$type<MaterialConditionName>()
			.notNull()
	},
	(t) => [
		sqlite
			.unique('inventory_session_expected_assets_session_asset_unique')
			.on(t.sessionId, t.assetId),

		sqlite
			.index('inventory_session_expected_assets_session_id_idx')
			.on(t.sessionId)
	]
)

export const inventorySessionExpectedAssetsRelations = relations(
	inventorySessionExpectedAssets,
	({ one }) => ({
		session: one(inventorySessions, {
			fields: [inventorySessionExpectedAssets.sessionId],
			references: [inventorySessions.id]
		}),

		asset: one(materialAssets, {
			fields: [inventorySessionExpectedAssets.assetId],
			references: [materialAssets.id]
		})
	})
)

export type InventorySessionExpectedAssetDB = InferSelectModel<
	typeof inventorySessionExpectedAssets
>

export type InventorySessionExpectedAssetParams = InferInsertModel<
	typeof inventorySessionExpectedAssets
>
