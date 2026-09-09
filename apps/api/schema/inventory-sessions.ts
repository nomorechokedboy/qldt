import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { rooms } from './rooms'
import { units } from './units'
import { users } from './users'
import { inventorySessionExpectedAssets } from './inventory-session-inspected-assets'
import { inventorySessionScans } from './inventory-session-scans'

export type InventorySessionStatus = 'in_progress' | 'completed' | 'reviewed'

const InventorySessionStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!['in_progress', 'completed', 'reviewed'].includes(val)) {
			throw new Error(
				`status must be one of in_progress, completed, reviewed`
			)
		}
		return val
	}
})

export const inventorySessions = sqlite.sqliteTable(
	'inventory_sessions',
	{
		...baseSchema,

		roomId: sqlite
			.int()
			.notNull()
			.references(() => rooms.id),

		unitId: sqlite
			.int()
			.notNull()
			.references(() => units.id),

		startedByUserId: sqlite
			.int()
			.notNull()
			.references(() => users.id),

		status: InventorySessionStatusEnum('status')
			.$type<InventorySessionStatus>()
			.default('in_progress')
			.notNull(),

		completedAt: sqlite.text()
	},
	(t) => [
		sqlite.index('inventory_sessions_room_id_idx').on(t.roomId),
		sqlite.index('inventory_sessions_unit_id_idx').on(t.unitId),
		sqlite
			.index('inventory_sessions_started_by_user_id_idx')
			.on(t.startedByUserId)
	]
)

export const inventorySessionsRelations = relations(
	inventorySessions,
	({ one, many }) => ({
		room: one(rooms, {
			fields: [inventorySessions.roomId],
			references: [rooms.id]
		}),

		unit: one(units, {
			fields: [inventorySessions.unitId],
			references: [units.id]
		}),

		startedBy: one(users, {
			fields: [inventorySessions.startedByUserId],
			references: [users.id]
		}),

		expectedAssets: many(inventorySessionExpectedAssets),
		scans: many(inventorySessionScans)
	})
)

export type InventorySessionDB = InferSelectModel<typeof inventorySessions>
export type InventorySessionParams = InferInsertModel<typeof inventorySessions>
