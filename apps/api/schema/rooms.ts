import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { Building, buildings } from './buildings'
import { MaterialAsset, materialAssets } from './material-assets'
import { MaterialStock, materialStocks } from './material-stocks'
import { Unit, units } from './units'

export const rooms = sqlite.sqliteTable('rooms', {
	...baseSchema,
	unitId: sqlite
		.int()
		.notNull()
		.references(() => units.id),
	buildingId: sqlite.int().references(() => buildings.id),
	name: sqlite.text().notNull(),
	type: sqlite.text(),
	description: sqlite.text()
})

export const roomsRelations = relations(rooms, ({ one, many }) => ({
	unit: one(units, {
		fields: [rooms.unitId],
		references: [units.id]
	}),
	building: one(buildings, {
		fields: [rooms.buildingId],
		references: [buildings.id]
	}),
	materialStocks: many(materialStocks),
	materialAssets: many(materialAssets)
}))

export type RoomDB = InferSelectModel<typeof rooms>

export type RoomParams = InferInsertModel<typeof rooms>

type room = Omit<RoomDB, 'unitId' | 'buildingId'>

export type Room = room & {
	unit?: Unit | null
	building?: Building | null
	materialStocks?: MaterialStock[]
	materialAssets?: MaterialAsset[]
}

export type RoomQuery = {
	unitIds?: number[]
	buildingId?: number
	ids?: number[]
}

export type UpdateRoomMap = {
	id: number
	updatePayload: Partial<{
		unitId: number
		buildingId: number | null
		name: string
		type: string | null
		description: string | null
	}>
}[]
