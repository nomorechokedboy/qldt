import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { inventorySessions } from './inventory-sessions'
import { materialTypes } from './material-types'
import { MaterialConditionName } from './material-stocks'

// Snapshot of a room's material_stocks rows taken when a session's challenge
// is issued - plays the same role inventory_session_expected_assets plays
// for serials, so a stock edit made from the PC mid-session doesn't
// retroactively change what the phone is reconciling against. See
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
export const inventorySessionExpectedStocks = sqlite.sqliteTable(
	'inventory_session_expected_stocks',
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

		expectedQuantity: sqlite.int().notNull()
	},
	(t) => [
		sqlite
			.unique(
				'inventory_session_expected_stocks_session_type_condition_unique'
			)
			.on(t.sessionId, t.materialTypeId, t.condition),

		sqlite
			.index('inventory_session_expected_stocks_session_id_idx')
			.on(t.sessionId)
	]
)

export const inventorySessionExpectedStocksRelations = relations(
	inventorySessionExpectedStocks,
	({ one }) => ({
		session: one(inventorySessions, {
			fields: [inventorySessionExpectedStocks.sessionId],
			references: [inventorySessions.id]
		}),

		materialType: one(materialTypes, {
			fields: [inventorySessionExpectedStocks.materialTypeId],
			references: [materialTypes.id]
		})
	})
)

export type InventorySessionExpectedStockDB = InferSelectModel<
	typeof inventorySessionExpectedStocks
>

export type InventorySessionExpectedStockParams = InferInsertModel<
	typeof inventorySessionExpectedStocks
>
