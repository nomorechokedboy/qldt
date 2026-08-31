import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'

export type MaterialCategoryName =
	| 'furniture'
	| 'equipment'
	| 'weapon'
	| 'vehicle'

const materialCategories: MaterialCategoryName[] = [
	'furniture',
	'equipment',
	'weapon',
	'vehicle'
]

const MaterialCategoryEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!materialCategories.includes(val as MaterialCategoryName)) {
			throw AppError.invalidArgument(
				`category must be one of ${materialCategories.join(', ')}`
			)
		}
		return val
	}
})

export const materialTypes = sqlite.sqliteTable('material_types', {
	...baseSchema,
	name: sqlite.text().unique().notNull(),
	category: MaterialCategoryEnum('category')
		.$type<MaterialCategoryName>()
		.notNull(),
	unitOfMeasure: sqlite.text().default('cái'),
	isSerialized: sqlite.int({ mode: 'boolean' }).default(false).notNull()
})

export const materialTypesRelations = relations(materialTypes, () => ({}))

export type MaterialTypeDB = InferSelectModel<typeof materialTypes>

export type MaterialTypeParams = InferInsertModel<typeof materialTypes>

export type MaterialType = MaterialTypeDB

export type MaterialTypeQuery = {
	category?: MaterialCategoryName
	isSerialized?: boolean
	ids?: number[]
}

export type UpdateMaterialTypeMap = {
	id: number
	updatePayload: Partial<{
		name: string
		category: MaterialCategoryName
		unitOfMeasure: string | null
		isSerialized: boolean
	}>
}[]
