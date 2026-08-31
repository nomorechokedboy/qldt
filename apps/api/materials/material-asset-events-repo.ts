import { and, eq, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { MaterialAssetEventRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	MaterialAssetEvent,
	MaterialAssetEventDB,
	MaterialAssetEventParams,
	MaterialAssetEventQuery,
	materialAssetEvents
} from '../schema/material-asset-events'
import { handleDatabaseErr } from '../utils'

class repo implements MaterialAssetEventRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(
		params: MaterialAssetEventParams[]
	): Promise<MaterialAssetEventDB[]> {
		log.info('MaterialAssetEventRepo.create params: ', { params })
		return this.db
			.insert(materialAssetEvents)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: MaterialAssetEventQuery): Promise<MaterialAssetEvent[]> {
		const conditions: SQL[] = []
		if (query.assetId !== undefined) {
			conditions.push(eq(materialAssetEvents.assetId, query.assetId))
		}

		return this.db.query.materialAssetEvents
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: { actor: true }
			})
			.catch(handleDatabaseErr) as unknown as MaterialAssetEvent[]
	}
}

const materialAssetEventRepo = new repo(orm)

export default materialAssetEventRepo
