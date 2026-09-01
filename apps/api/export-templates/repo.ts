import { eq } from 'drizzle-orm'
import log from 'encore.dev/log'
import { ExportTemplateRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	ExportTemplateDB,
	ExportTemplateParams,
	ExportTemplateQuery,
	exportTemplates
} from '../schema/export-templates'
import { handleDatabaseErr } from '../utils'

class repo implements ExportTemplateRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: ExportTemplateParams): Promise<ExportTemplateDB> {
		log.info('ExportTemplateRepo.create params: ', { params })
		return this.db
			.insert(exportTemplates)
			.values(params)
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	delete(id: number): Promise<ExportTemplateDB | undefined> {
		log.trace('ExportTemplateRepo.delete params: ', { id })
		return this.db
			.delete(exportTemplates)
			.where(eq(exportTemplates.id, id))
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	find(query: ExportTemplateQuery): Promise<ExportTemplateDB[]> {
		return this.db.query.exportTemplates
			.findMany({
				where:
					query.resourceType === undefined
						? undefined
						: eq(exportTemplates.resourceType, query.resourceType)
			})
			.catch(handleDatabaseErr)
	}

	getOne(id: number): Promise<ExportTemplateDB | undefined> {
		return this.db.query.exportTemplates
			.findFirst({ where: eq(exportTemplates.id, id) })
			.catch(handleDatabaseErr)
	}
}

const exportTemplateRepo = new repo(orm)

export default exportTemplateRepo
