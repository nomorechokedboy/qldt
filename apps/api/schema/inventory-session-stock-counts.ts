import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { inventorySessions } from './inventory-sessions'
import { materialTypes } from './material-types'
import { MaterialConditionName } from './material-stocks'

// The phone's stock tally for a session. Deliberately has NO unique
// constraint on (sessionId, materialTypeId, condition), unlike
// inventory_session_expected_stocks - an "extra" count (a materialType/
// condition combination not in expectedStocks) needs to be insertable the
// same way an extra scan already is in inventory_session_scans. See
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
export const inventorySessionStockCounts = sqlite.sqliteTable(
	'inventory_session_stock_counts',
	{
		...baseSchema,

		sessionId: sqlite
			.int()
			.notNull()
			.references(() => inventorySessions.id),

		materialTypeId: sqlite
			.int()
			.notNull()
			.references(() => materialTypes.id),

		condition: sqlite.text().$type<MaterialConditionName>().notNull(),

		observedQuantity: sqlite.int().notNull()
	},
	(t) => [
		sqlite
			.index('inventory_session_stock_counts_session_id_idx')
			.on(t.sessionId)
	]
)

export const inventorySessionStockCountsRelations = relations(
	inventorySessionStockCounts,
	({ one }) => ({
		session: one(inventorySessions, {
			fields: [inventorySessionStockCounts.sessionId],
			references: [inventorySessions.id]
		}),

		materialType: one(materialTypes, {
			fields: [inventorySessionStockCounts.materialTypeId],
			references: [materialTypes.id]
		})
	})
)

export type InventorySessionStockCountDB = InferSelectModel<
	typeof inventorySessionStockCounts
>

export type InventorySessionStockCountParams = InferInsertModel<
	typeof inventorySessionStockCounts
>
