import { and, eq, inArray, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { BuildingRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	Building,
	BuildingDB,
	BuildingParams,
	BuildingQuery,
	buildings,
	UpdateBuildingMap
} from '../schema/buildings'
import { handleDatabaseErr } from '../utils'

class repo implements BuildingRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: BuildingParams[]): Promise<BuildingDB[]> {
		log.info('BuildingRepo.create params: ', { params })
		return this.db
			.insert(buildings)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	update(params: UpdateBuildingMap): Promise<BuildingDB[]> {
		log.info('BuildingRepo.update params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: BuildingDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(buildings)
						.set(updatePayload)
						.where(eq(buildings.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(b: BuildingDB[]): Promise<BuildingDB[]> {
		const ids = b.map((building) => building.id)
		log.trace('BuildingRepo.delete params: ', { params: ids })

		return this.db
			.delete(buildings)
			.where(inArray(buildings.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: BuildingQuery): Promise<Building[]> {
		const conditions: SQL[] = []
		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(inArray(buildings.unitId, query.unitIds))
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(buildings.id, query.ids))
		}

		return this.db.query.buildings
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: { unit: true, rooms: true }
			})
			.catch(handleDatabaseErr) as unknown as Building[]
	}

	findByIds(ids: number[]): Promise<BuildingDB[]> {
		return this.db.query.buildings
			.findMany({ where: inArray(buildings.id, ids) })
			.catch(handleDatabaseErr)
	}

	getOne(params: Partial<BuildingDB>): Promise<Building | undefined> {
		if (!params || Object.keys(params).length === 0) {
			throw new Error(
				'Invalid parameters: at least one field must be provided'
			)
		}

		const conditions = Object.entries(params)
			.filter(([_, value]) => value !== undefined && value !== null)
			.map(([key, value]) =>
				eq(buildings[key as keyof typeof buildings], value)
			)

		if (conditions.length === 0) {
			throw new Error('Invalid parameters: no valid fields provided')
		}

		return this.db.query.buildings
			.findFirst({
				where:
					conditions.length === 1
						? conditions[0]
						: and(...conditions),
				with: { unit: true, rooms: true }
			})
			.catch(handleDatabaseErr) as unknown as Building | undefined
	}
}

const buildingRepo = new repo(orm)

export default buildingRepo
