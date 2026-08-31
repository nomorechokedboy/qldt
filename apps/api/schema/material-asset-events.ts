import { InferInsertModel, InferSelectModel, relations, sql } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import { materialAssets } from './material-assets'
import { users } from './users'

export type MaterialAssetEventType =
	| 'assigned'
	| 'unassigned'
	| 'condition_changed'
	| 'status_changed'
	| 'transferred'

const materialAssetEventTypes: MaterialAssetEventType[] = [
	'assigned',
	'unassigned',
	'condition_changed',
	'status_changed',
	'transferred'
]

const AssetEventTypeEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!materialAssetEventTypes.includes(val as MaterialAssetEventType)) {
			throw AppError.invalidArgument(
				`eventType must be one of ${materialAssetEventTypes.join(', ')}`
			)
		}
		return val
	}
})

export const materialAssetEvents = sqlite.sqliteTable('material_asset_events', {
	...baseSchema,
	assetId: sqlite
		.int()
		.notNull()
		.references(() => materialAssets.id, { onDelete: 'cascade' }),
	eventType: AssetEventTypeEnum('eventType')
		.$type<MaterialAssetEventType>()
		.notNull(),
	previousValue: sqlite
		.text({ mode: 'json' })
		.default(sql`'{}'`)
		.$type<Record<string, unknown>>(),
	newValue: sqlite
		.text({ mode: 'json' })
		.default(sql`'{}'`)
		.$type<Record<string, unknown>>(),
	note: sqlite.text(),
	actorUserId: sqlite.int().references(() => users.id)
})

export const materialAssetEventsRelations = relations(
	materialAssetEvents,
	({ one }) => ({
		asset: one(materialAssets, {
			fields: [materialAssetEvents.assetId],
			references: [materialAssets.id]
		}),
		actor: one(users, {
			fields: [materialAssetEvents.actorUserId],
			references: [users.id]
		})
	})
)

export type MaterialAssetEventDB = InferSelectModel<typeof materialAssetEvents>

export type MaterialAssetEventParams = InferInsertModel<
	typeof materialAssetEvents
>

type materialAssetEvent = Omit<MaterialAssetEventDB, 'actorUserId'>

export type MaterialAssetEvent = materialAssetEvent & {
	actor?: { id: number; displayName?: string } | null
}

export type MaterialAssetEventQuery = {
	assetId?: number
	ids?: number[]
}
