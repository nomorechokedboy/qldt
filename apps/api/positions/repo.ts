import { and, eq, inArray, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { Repository, UpdatePositionMap, PositionQuery } from '.'
import orm, { DrizzleDatabase } from '../database'
import { PositionDB, PositionParam, positions } from '../schema/positions'
import { handleDatabaseErr } from '../utils'

class sqliteRepo implements Repository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: PositionParam[]): Promise<PositionDB[]> {
		log.info('PositionRepo.create params', { params })
		return this.db
			.insert(positions)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	update(params: UpdatePositionMap): Promise<PositionDB[]> {
		log.info('PositionRepo.update params', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: PositionDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(positions)
						.set(updatePayload)
						.where(eq(positions.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(p: PositionDB[]): Promise<PositionDB[]> {
		const ids = p.map((position) => position.id)
		log.info('PositionRepo.delete params', { params: ids })

		return this.db
			.delete(positions)
			.where(inArray(positions.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: PositionQuery): Promise<PositionDB[]> {
		log.trace('PositionRepo.find params', { query })

		const conditions: SQL[] = []
		if (query.level !== undefined) {
			conditions.push(eq(positions.level, query.level))
		}
		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(positions.id, query.ids))
		}

		return this.db.query.positions
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

	findByIds(ids: number[]): Promise<PositionDB[]> {
		return this.db.query.positions
			.findMany({ where: inArray(positions.id, ids) })
			.catch(handleDatabaseErr)
	}

	findByLevel(level: string): Promise<PositionDB[]> {
		log.trace('PositionRepo.findByLevel params', { level })

		return this.db.query.positions
			.findMany({ where: eq(positions.level, level) })
			.catch(handleDatabaseErr)
	}
}

const positionRepo = new sqliteRepo(orm)

export default positionRepo
