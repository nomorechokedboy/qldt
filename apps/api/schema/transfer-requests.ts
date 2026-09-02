import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import { MaterialAsset, materialAssets } from './material-assets'
import { MaterialConditionName, materialConditions } from './material-stocks'
import { MaterialType, materialTypes } from './material-types'
import { Room, rooms } from './rooms'
import { StudentDB, students } from './student'
import { Unit, units } from './units'
import { UserDB, users } from './users'

export type TransferRequestStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'cancelled'

const transferRequestStatuses: TransferRequestStatus[] = [
	'pending',
	'approved',
	'rejected',
	'cancelled'
]

const TransferRequestStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!transferRequestStatuses.includes(val as TransferRequestStatus)) {
			throw AppError.invalidArgument(
				`status must be one of ${transferRequestStatuses.join(', ')}`
			)
		}
		return val
	}
})

// Per-line-item status: a mixed-resource request can partially fail at
// approval time (e.g. one trooper already reassigned elsewhere) without
// failing items that are still valid.
export type TransferRequestItemStatus = 'pending' | 'approved' | 'failed'

const transferRequestItemStatuses: TransferRequestItemStatus[] = [
	'pending',
	'approved',
	'failed'
]

const TransferRequestItemStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (
			!transferRequestItemStatuses.includes(
				val as TransferRequestItemStatus
			)
		) {
			throw AppError.invalidArgument(
				`itemStatus must be one of ${transferRequestItemStatuses.join(', ')}`
			)
		}
		return val
	}
})

export const transferRequests = sqlite.sqliteTable('transfer_requests', {
	...baseSchema,
	sourceUnitId: sqlite
		.int()
		.notNull()
		.references((): sqlite.AnySQLiteColumn => units.id),
	destinationUnitId: sqlite
		.int()
		.notNull()
		.references((): sqlite.AnySQLiteColumn => units.id),
	destinationRoomId: sqlite.int().references(() => rooms.id),
	requestedByUserId: sqlite
		.int()
		.notNull()
		.references((): sqlite.AnySQLiteColumn => users.id),
	approverUserId: sqlite
		.int()
		.notNull()
		.references((): sqlite.AnySQLiteColumn => users.id),
	decidedByUserId: sqlite
		.int()
		.references((): sqlite.AnySQLiteColumn => users.id),
	decidedAt: sqlite.text(),
	status: TransferRequestStatusEnum('status')
		.$type<TransferRequestStatus>()
		.default('pending')
		.notNull(),
	rejectionReason: sqlite.text()
})

export const transferRequestTroopers = sqlite.sqliteTable(
	'transfer_request_troopers',
	{
		...baseSchema,
		transferRequestId: sqlite
			.int()
			.notNull()
			.references(() => transferRequests.id),
		studentId: sqlite
			.int()
			.notNull()
			.references(() => students.id),
		itemStatus: TransferRequestItemStatusEnum('itemStatus')
			.$type<TransferRequestItemStatus>()
			.default('pending')
			.notNull(),
		failureReason: sqlite.text()
	}
)

export const transferRequestTroopersRelations = relations(
	transferRequestTroopers,
	({ one }) => ({
		transferRequest: one(transferRequests, {
			fields: [transferRequestTroopers.transferRequestId],
			references: [transferRequests.id]
		}),
		student: one(students, {
			fields: [transferRequestTroopers.studentId],
			references: [students.id]
		})
	})
)

export const transferRequestMaterialAssets = sqlite.sqliteTable(
	'transfer_request_material_assets',
	{
		...baseSchema,
		transferRequestId: sqlite
			.int()
			.notNull()
			.references(() => transferRequests.id),
		materialAssetId: sqlite
			.int()
			.notNull()
			.references(() => materialAssets.id),
		itemStatus: TransferRequestItemStatusEnum('itemStatus')
			.$type<TransferRequestItemStatus>()
			.default('pending')
			.notNull(),
		failureReason: sqlite.text()
	}
)

export const transferRequestMaterialAssetsRelations = relations(
	transferRequestMaterialAssets,
	({ one }) => ({
		transferRequest: one(transferRequests, {
			fields: [transferRequestMaterialAssets.transferRequestId],
			references: [transferRequests.id]
		}),
		materialAsset: one(materialAssets, {
			fields: [transferRequestMaterialAssets.materialAssetId],
			references: [materialAssets.id]
		})
	})
)

export const transferRequestMaterialStocks = sqlite.sqliteTable(
	'transfer_request_material_stocks',
	{
		...baseSchema,
		transferRequestId: sqlite
			.int()
			.notNull()
			.references(() => transferRequests.id),
		materialTypeId: sqlite
			.int()
			.notNull()
			.references(() => materialTypes.id),
		condition: sqlite.text().notNull().$type<MaterialConditionName>(),
		quantity: sqlite.int().notNull(),
		itemStatus: TransferRequestItemStatusEnum('itemStatus')
			.$type<TransferRequestItemStatus>()
			.default('pending')
			.notNull(),
		failureReason: sqlite.text()
	}
)

export const transferRequestMaterialStocksRelations = relations(
	transferRequestMaterialStocks,
	({ one }) => ({
		transferRequest: one(transferRequests, {
			fields: [transferRequestMaterialStocks.transferRequestId],
			references: [transferRequests.id]
		}),
		materialType: one(materialTypes, {
			fields: [transferRequestMaterialStocks.materialTypeId],
			references: [materialTypes.id]
		})
	})
)

export const transferRequestsRelations = relations(
	transferRequests,
	({ one, many }) => ({
		sourceUnit: one(units, {
			fields: [transferRequests.sourceUnitId],
			references: [units.id],
			relationName: 'transferRequestSourceUnit'
		}),
		destinationUnit: one(units, {
			fields: [transferRequests.destinationUnitId],
			references: [units.id],
			relationName: 'transferRequestDestinationUnit'
		}),
		destinationRoom: one(rooms, {
			fields: [transferRequests.destinationRoomId],
			references: [rooms.id]
		}),
		requestedBy: one(users, {
			fields: [transferRequests.requestedByUserId],
			references: [users.id],
			relationName: 'transferRequestRequestedBy'
		}),
		approver: one(users, {
			fields: [transferRequests.approverUserId],
			references: [users.id],
			relationName: 'transferRequestApprover'
		}),
		decidedBy: one(users, {
			fields: [transferRequests.decidedByUserId],
			references: [users.id],
			relationName: 'transferRequestDecidedBy'
		}),
		troopers: many(transferRequestTroopers),
		materialAssetItems: many(transferRequestMaterialAssets),
		materialStockItems: many(transferRequestMaterialStocks)
	})
)

export type TransferRequestDB = InferSelectModel<typeof transferRequests>
export type TransferRequestParams = InferInsertModel<typeof transferRequests>

export type TransferRequestTrooperDB = InferSelectModel<
	typeof transferRequestTroopers
>
export type TransferRequestTrooperParams = InferInsertModel<
	typeof transferRequestTroopers
>

export type TransferRequestMaterialAssetDB = InferSelectModel<
	typeof transferRequestMaterialAssets
>
export type TransferRequestMaterialAssetParams = InferInsertModel<
	typeof transferRequestMaterialAssets
>

export type TransferRequestMaterialStockDB = InferSelectModel<
	typeof transferRequestMaterialStocks
>
export type TransferRequestMaterialStockParams = InferInsertModel<
	typeof transferRequestMaterialStocks
>

type transferRequest = Omit<
	TransferRequestDB,
	| 'sourceUnitId'
	| 'destinationUnitId'
	| 'destinationRoomId'
	| 'requestedByUserId'
	| 'approverUserId'
	| 'decidedByUserId'
>

export type TransferRequest = transferRequest & {
	sourceUnit?: Unit
	destinationUnit?: Unit
	destinationRoom?: Room | null
	requestedBy?: UserDB
	approver?: UserDB
	decidedBy?: UserDB | null
	troopers?: TransferRequestTrooper[]
	materialAssetItems?: TransferRequestMaterialAssetItem[]
	materialStockItems?: TransferRequestMaterialStockItem[]
}

type transferRequestTrooper = Omit<
	TransferRequestTrooperDB,
	'transferRequestId' | 'studentId'
>

export type TransferRequestTrooper = transferRequestTrooper & {
	student?: StudentDB
}

type transferRequestMaterialAssetItem = Omit<
	TransferRequestMaterialAssetDB,
	'transferRequestId' | 'materialAssetId'
>

export type TransferRequestMaterialAssetItem =
	transferRequestMaterialAssetItem & {
		materialAsset?: MaterialAsset
	}

type transferRequestMaterialStockItem = Omit<
	TransferRequestMaterialStockDB,
	'transferRequestId' | 'materialTypeId'
>

export type TransferRequestMaterialStockItem =
	transferRequestMaterialStockItem & {
		materialType?: MaterialType
	}

export type TransferRequestQuery = {
	unitIds?: number[]
	status?: TransferRequestStatus
	requestedByUserId?: number
	approverUserId?: number
	ids?: number[]
}

export type UpdateTransferRequestMap = {
	id: number
	updatePayload: Partial<{
		status: TransferRequestStatus
		decidedByUserId: number | null
		decidedAt: string | null
		rejectionReason: string | null
	}>
}[]

export type CreateTransferRequestTrooperInput = {
	studentId: number
}

export type CreateTransferRequestMaterialAssetInput = {
	materialAssetId: number
}

export type CreateTransferRequestMaterialStockInput = {
	materialTypeId: number
	condition: MaterialConditionName
	quantity: number
}

export type CreateTransferRequestInput = {
	sourceUnitId: number
	destinationUnitId: number
	destinationRoomId?: number | null
	approverUserId: number
	troopers?: CreateTransferRequestTrooperInput[]
	materialAssets?: CreateTransferRequestMaterialAssetInput[]
	materialStocks?: CreateTransferRequestMaterialStockInput[]
}
