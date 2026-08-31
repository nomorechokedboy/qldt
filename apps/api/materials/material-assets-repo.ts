import { and, eq, inArray, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { MaterialAssetRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	MaterialAsset,
	MaterialAssetDB,
	MaterialAssetParams,
	MaterialAssetQuery,
	materialAssets,
	UpdateMaterialAssetMap
} from '../schema/material-assets'
import { handleDatabaseErr } from '../utils'

class repo implements MaterialAssetRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: MaterialAssetParams[]): Promise<MaterialAssetDB[]> {
		log.info('MaterialAssetRepo.create params: ', { params })
		return this.db
			.insert(materialAssets)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	update(params: UpdateMaterialAssetMap): Promise<MaterialAssetDB[]> {
		log.info('MaterialAssetRepo.update params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: MaterialAssetDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(materialAssets)
						.set(updatePayload)
						.where(eq(materialAssets.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(m: MaterialAssetDB[]): Promise<MaterialAssetDB[]> {
		const ids = m.map((materialAsset) => materialAsset.id)
		log.trace('MaterialAssetRepo.delete params: ', { params: ids })

		return this.db
			.delete(materialAssets)
			.where(inArray(materialAssets.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: MaterialAssetQuery): Promise<MaterialAsset[]> {
		const conditions: SQL[] = []
		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(inArray(materialAssets.unitId, query.unitIds))
		}

		if (query.roomId !== undefined) {
			conditions.push(eq(materialAssets.roomId, query.roomId))
		}

		if (query.materialTypeId !== undefined) {
			conditions.push(
				eq(materialAssets.materialTypeId, query.materialTypeId)
			)
		}

		if (query.status !== undefined) {
			conditions.push(eq(materialAssets.status, query.status))
		}

		if (query.assignedTrooperId !== undefined) {
			conditions.push(
				eq(materialAssets.assignedTrooperId, query.assignedTrooperId)
			)
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(materialAssets.id, query.ids))
		}

		return this.db.query.materialAssets
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: {
					materialType: true,
					unit: true,
					room: true,
					assignedTrooper: true
				}
			})
			.catch(handleDatabaseErr) as unknown as MaterialAsset[]
	}

	findByIds(ids: number[]): Promise<MaterialAssetDB[]> {
		return this.db.query.materialAssets
			.findMany({ where: inArray(materialAssets.id, ids) })
			.catch(handleDatabaseErr)
	}

	getOne(
		params: Partial<MaterialAssetDB>
	): Promise<MaterialAsset | undefined> {
		if (!params || Object.keys(params).length === 0) {
			throw new Error(
				'Invalid parameters: at least one field must be provided'
			)
		}

		const conditions = Object.entries(params)
			.filter(([_, value]) => value !== undefined && value !== null)
			.map(([key, value]) =>
				eq(materialAssets[key as keyof typeof materialAssets], value)
			)

		if (conditions.length === 0) {
			throw new Error('Invalid parameters: no valid fields provided')
		}

		return this.db.query.materialAssets
			.findFirst({
				where:
					conditions.length === 1
						? conditions[0]
						: and(...conditions),
				with: {
					materialType: true,
					unit: true,
					room: true,
					assignedTrooper: true
				}
			})
			.catch(handleDatabaseErr) as unknown as MaterialAsset | undefined
	}
}

const materialAssetRepo = new repo(orm)

export default materialAssetRepo
