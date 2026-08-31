import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import { MaterialType, materialTypes } from './material-types'
import { Room, rooms } from './rooms'
import { Unit, units } from './units'

export type MaterialConditionName =
	| 'good'
	| 'fair'
	| 'needs_maintenance'
	| 'damaged'

export const materialConditions: MaterialConditionName[] = [
	'good',
	'fair',
	'needs_maintenance',
	'damaged'
]

const MaterialConditionEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!materialConditions.includes(val as MaterialConditionName)) {
			throw AppError.invalidArgument(
				`condition must be one of ${materialConditions.join(', ')}`
			)
		}
		return val
	}
})

export const materialStocks = sqlite.sqliteTable(
	'material_stocks',
	{
		...baseSchema,
		materialTypeId: sqlite
			.int()
			.notNull()
			.references(() => materialTypes.id),
		unitId: sqlite
			.int()
			.notNull()
			.references(() => units.id),
		roomId: sqlite.int().references(() => rooms.id),
		quantity: sqlite.int().notNull().default(0),
		condition: MaterialConditionEnum('condition')
			.$type<MaterialConditionName>()
			.default('good')
	},
	(t) => [
		sqlite
			.unique('material_stock_unique_constraint')
			.on(t.materialTypeId, t.unitId, t.roomId, t.condition)
	]
)

export const materialStocksRelations = relations(materialStocks, ({ one }) => ({
	materialType: one(materialTypes, {
		fields: [materialStocks.materialTypeId],
		references: [materialTypes.id]
	}),
	unit: one(units, {
		fields: [materialStocks.unitId],
		references: [units.id]
	}),
	room: one(rooms, {
		fields: [materialStocks.roomId],
		references: [rooms.id]
	})
}))

export type MaterialStockDB = InferSelectModel<typeof materialStocks>

export type MaterialStockParams = InferInsertModel<typeof materialStocks>

type materialStock = Omit<
	MaterialStockDB,
	'materialTypeId' | 'unitId' | 'roomId'
>

export type MaterialStock = materialStock & {
	materialType?: MaterialType
	unit?: Unit | null
	room?: Room | null
}

export type MaterialStockQuery = {
	unitIds?: number[]
	roomId?: number
	materialTypeId?: number
	ids?: number[]
}

export type UpdateMaterialStockMap = {
	id: number
	updatePayload: Partial<{
		materialTypeId: number
		unitId: number
		roomId: number | null
		quantity: number
		condition: MaterialConditionName
	}>
}[]
