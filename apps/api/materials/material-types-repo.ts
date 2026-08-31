import { and, eq, inArray, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { MaterialTypeRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	MaterialType,
	MaterialTypeDB,
	MaterialTypeParams,
	MaterialTypeQuery,
	materialTypes,
	UpdateMaterialTypeMap
} from '../schema/material-types'
import { handleDatabaseErr } from '../utils'

class repo implements MaterialTypeRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: MaterialTypeParams[]): Promise<MaterialTypeDB[]> {
		log.info('MaterialTypeRepo.create params: ', { params })
		return this.db
			.insert(materialTypes)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	update(params: UpdateMaterialTypeMap): Promise<MaterialTypeDB[]> {
		log.info('MaterialTypeRepo.update params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: MaterialTypeDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(materialTypes)
						.set(updatePayload)
						.where(eq(materialTypes.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(m: MaterialTypeDB[]): Promise<MaterialTypeDB[]> {
		const ids = m.map((materialType) => materialType.id)
		log.trace('MaterialTypeRepo.delete params: ', { params: ids })

		return this.db
			.delete(materialTypes)
			.where(inArray(materialTypes.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: MaterialTypeQuery): Promise<MaterialType[]> {
		const conditions: SQL[] = []
		if (query.category !== undefined) {
			conditions.push(eq(materialTypes.category, query.category))
		}

		if (query.isSerialized !== undefined) {
			conditions.push(eq(materialTypes.isSerialized, query.isSerialized))
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(materialTypes.id, query.ids))
		}

		return this.db.query.materialTypes
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions)
			})
			.catch(handleDatabaseErr)
	}

	findByIds(ids: number[]): Promise<MaterialTypeDB[]> {
		return this.db.query.materialTypes
			.findMany({ where: inArray(materialTypes.id, ids) })
			.catch(handleDatabaseErr)
	}

	getOne(params: Partial<MaterialTypeDB>): Promise<MaterialType | undefined> {
		if (!params || Object.keys(params).length === 0) {
			throw new Error(
				'Invalid parameters: at least one field must be provided'
			)
		}

		const conditions = Object.entries(params)
			.filter(([_, value]) => value !== undefined && value !== null)
			.map(([key, value]) =>
				eq(materialTypes[key as keyof typeof materialTypes], value)
			)

		if (conditions.length === 0) {
			throw new Error('Invalid parameters: no valid fields provided')
		}

		return this.db.query.materialTypes
			.findFirst({
				where:
					conditions.length === 1 ? conditions[0] : and(...conditions)
			})
			.catch(handleDatabaseErr)
	}
}

const materialTypeRepo = new repo(orm)

export default materialTypeRepo
