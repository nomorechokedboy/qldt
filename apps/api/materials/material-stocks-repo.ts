import { and, eq, inArray, isNull, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { MaterialStockRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	MaterialStock,
	MaterialStockDB,
	MaterialStockParams,
	MaterialStockQuery,
	materialStocks,
	UpdateMaterialStockMap
} from '../schema/material-stocks'
import { handleDatabaseErr } from '../utils'

class repo implements MaterialStockRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: MaterialStockParams[]): Promise<MaterialStockDB[]> {
		log.info('MaterialStockRepo.create params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const results: MaterialStockDB[] = []

				for (const param of params) {
					const condition = param.condition ?? 'good'
					const roomCondition =
						param.roomId === undefined || param.roomId === null
							? isNull(materialStocks.roomId)
							: eq(materialStocks.roomId, param.roomId)

					const existing = await tx.query.materialStocks.findFirst({
						where: and(
							eq(
								materialStocks.materialTypeId,
								param.materialTypeId
							),
							eq(materialStocks.unitId, param.unitId),
							roomCondition,
							eq(materialStocks.condition, condition)
						)
					})

					if (existing !== undefined) {
						const [updated] = await tx
							.update(materialStocks)
							.set({
								quantity:
									existing.quantity + (param.quantity ?? 0)
							})
							.where(eq(materialStocks.id, existing.id))
							.returning()
						results.push(updated)
					} else {
						const [created] = await tx
							.insert(materialStocks)
							.values(param)
							.returning()
						results.push(created)
					}
				}

				return results
			})
			.catch(handleDatabaseErr)
	}

	update(params: UpdateMaterialStockMap): Promise<MaterialStockDB[]> {
		log.info('MaterialStockRepo.update params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: MaterialStockDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(materialStocks)
						.set(updatePayload)
						.where(eq(materialStocks.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(m: MaterialStockDB[]): Promise<MaterialStockDB[]> {
		const ids = m.map((materialStock) => materialStock.id)
		log.trace('MaterialStockRepo.delete params: ', { params: ids })

		return this.db
			.delete(materialStocks)
			.where(inArray(materialStocks.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: MaterialStockQuery): Promise<MaterialStock[]> {
		const conditions: SQL[] = []
		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(inArray(materialStocks.unitId, query.unitIds))
		}

		if (query.roomId !== undefined) {
			conditions.push(eq(materialStocks.roomId, query.roomId))
		}

		if (query.materialTypeId !== undefined) {
			conditions.push(
				eq(materialStocks.materialTypeId, query.materialTypeId)
			)
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(materialStocks.id, query.ids))
		}

		return this.db.query.materialStocks
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: { materialType: true, unit: true, room: true }
			})
			.catch(handleDatabaseErr) as unknown as MaterialStock[]
	}

	findByIds(ids: number[]): Promise<MaterialStockDB[]> {
		return this.db.query.materialStocks
			.findMany({ where: inArray(materialStocks.id, ids) })
			.catch(handleDatabaseErr)
	}

	getOne(
		params: Partial<MaterialStockDB>
	): Promise<MaterialStock | undefined> {
		if (!params || Object.keys(params).length === 0) {
			throw new Error(
				'Invalid parameters: at least one field must be provided'
			)
		}

		const conditions = Object.entries(params)
			.filter(([_, value]) => value !== undefined && value !== null)
			.map(([key, value]) =>
				eq(materialStocks[key as keyof typeof materialStocks], value)
			)

		if (conditions.length === 0) {
			throw new Error('Invalid parameters: no valid fields provided')
		}

		return this.db.query.materialStocks
			.findFirst({
				where:
					conditions.length === 1
						? conditions[0]
						: and(...conditions),
				with: { materialType: true, unit: true, room: true }
			})
			.catch(handleDatabaseErr) as unknown as MaterialStock | undefined
	}
}

const materialStockRepo = new repo(orm)

export default materialStockRepo
