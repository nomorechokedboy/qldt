import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'

export type ExportResourceType =
	| 'material_assets'
	| 'students'
	| 'material_stocks'

export const exportResourceTypes: ExportResourceType[] = [
	'material_assets',
	'students',
	'material_stocks'
]

const ExportResourceTypeEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!exportResourceTypes.includes(val as ExportResourceType)) {
			throw AppError.invalidArgument(
				`resourceType must be one of ${exportResourceTypes.join(', ')}`
			)
		}
		return val
	}
})

export const exportTemplates = sqlite.sqliteTable('export_templates', {
	...baseSchema,
	name: sqlite.text().notNull(),
	resourceType: ExportResourceTypeEnum('resource_type')
		.$type<ExportResourceType>()
		.notNull(),
	s3Key: sqlite.text('s3_key').notNull(),
	originalFilename: sqlite.text('original_filename').notNull(),
	uploadedByUserId: sqlite.int('uploaded_by_user_id')
})

export const exportTemplatesRelations = relations(exportTemplates, () => ({}))

export type ExportTemplateDB = InferSelectModel<typeof exportTemplates>

export type ExportTemplateParams = InferInsertModel<typeof exportTemplates>

export type ExportTemplate = ExportTemplateDB

export type ExportTemplateQuery = {
	resourceType?: ExportResourceType
}
