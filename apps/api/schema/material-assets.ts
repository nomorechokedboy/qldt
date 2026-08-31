import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import {
	MaterialAssetEvent,
	materialAssetEvents
} from './material-asset-events'
import { MaterialConditionName, materialConditions } from './material-stocks'
import { MaterialType, materialTypes } from './material-types'
import { Room, rooms } from './rooms'
import { StudentDB, students } from './student'
import { Unit, units } from './units'

export type MaterialAssetStatus = 'in_service' | 'damaged' | 'lost' | 'retired'

const materialAssetStatuses: MaterialAssetStatus[] = [
	'in_service',
	'damaged',
	'lost',
	'retired'
]

const AssetStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!materialAssetStatuses.includes(val as MaterialAssetStatus)) {
			throw AppError.invalidArgument(
				`status must be one of ${materialAssetStatuses.join(', ')}`
			)
		}
		return val
	}
})

const AssetConditionEnum = sqlite.customType<{
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

export const materialAssets = sqlite.sqliteTable('material_assets', {
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
	serialNumber: sqlite.text().unique().notNull(),
	condition: AssetConditionEnum('condition')
		.$type<MaterialConditionName>()
		.default('good'),
	status: AssetStatusEnum('status')
		.$type<MaterialAssetStatus>()
		.default('in_service')
		.notNull(),
	assignedTrooperId: sqlite.int().references(() => students.id)
})

export const materialAssetsRelations = relations(
	materialAssets,
	({ one, many }) => ({
		materialType: one(materialTypes, {
			fields: [materialAssets.materialTypeId],
			references: [materialTypes.id]
		}),
		unit: one(units, {
			fields: [materialAssets.unitId],
			references: [units.id]
		}),
		room: one(rooms, {
			fields: [materialAssets.roomId],
			references: [rooms.id]
		}),
		assignedTrooper: one(students, {
			fields: [materialAssets.assignedTrooperId],
			references: [students.id]
		}),
		events: many(materialAssetEvents)
	})
)

export type MaterialAssetDB = InferSelectModel<typeof materialAssets>

export type MaterialAssetParams = InferInsertModel<typeof materialAssets>

type materialAsset = Omit<
	MaterialAssetDB,
	'materialTypeId' | 'unitId' | 'roomId' | 'assignedTrooperId'
>

export type MaterialAsset = materialAsset & {
	materialType?: MaterialType
	unit?: Unit | null
	room?: Room | null
	assignedTrooper?: StudentDB | null
	events?: MaterialAssetEvent[]
}

export type MaterialAssetQuery = {
	unitIds?: number[]
	roomId?: number
	materialTypeId?: number
	status?: MaterialAssetStatus
	assignedTrooperId?: number
	ids?: number[]
}

export type UpdateMaterialAssetMap = {
	id: number
	updatePayload: Partial<{
		materialTypeId: number
		unitId: number
		roomId: number | null
		serialNumber: string
		condition: MaterialConditionName
		status: MaterialAssetStatus
		assignedTrooperId: number | null
	}>
}[]
