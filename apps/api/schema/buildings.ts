import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { Room, rooms } from './rooms'
import { Unit, units } from './units'

export const buildings = sqlite.sqliteTable('buildings', {
	...baseSchema,
	unitId: sqlite
		.int()
		.notNull()
		.references(() => units.id),
	name: sqlite.text().notNull(),
	description: sqlite.text()
})

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
	unit: one(units, {
		fields: [buildings.unitId],
		references: [units.id]
	}),
	rooms: many(rooms)
}))

export type BuildingDB = InferSelectModel<typeof buildings>

export type BuildingParams = InferInsertModel<typeof buildings>

type building = Omit<BuildingDB, 'unitId'>

export type Building = building & { unit?: Unit | null; rooms?: Room[] }

export type BuildingQuery = {
	unitIds?: number[]
	ids?: number[]
}

export type UpdateBuildingMap = {
	id: number
	updatePayload: Partial<{
		unitId: number
		name: string
		description: string | null
	}>
}[]
