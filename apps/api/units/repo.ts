import log from 'encore.dev/log'
import { Repository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	UnitParams,
	UnitDB,
	Unit,
	units,
	UnitQuery,
	UnitFilter,
	UnitRelations,
	UpdateUnitMap
} from '../schema/units'
import { handleDatabaseErr } from '../utils'
import { and, asc, eq, inArray, isNull, like, or, SQL } from 'drizzle-orm'

function relationsToWith(relations?: UnitRelations) {
	const withClause: Record<string, unknown> = {}
	if (relations?.parent) {
		withClause.parent = true
	}
	if (relations?.children === 'deep') {
		withClause.children = {
			with: { children: { with: { parent: true } }, parent: true }
		}
	} else if (relations?.children) {
		withClause.children = true
	}

	return Object.keys(withClause).length > 0 ? withClause : undefined
}

class repo implements Repository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: UnitParams[]): Promise<UnitDB[]> {
		log.info('UnitRepo.create params: ', { params })
		return this.db
			.insert(units)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	update(params: UpdateUnitMap): Promise<UnitDB[]> {
		log.info('UnitRepo.update params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: UnitDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(units)
						.set(updatePayload)
						.where(eq(units.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(u: UnitDB[]): Promise<UnitDB[]> {
		const ids = u.map((unit) => unit.id)
		log.trace('UnitRepo.delete params: ', { params: ids })

		return this.db
			.delete(units)
			.where(inArray(units.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	async find(query: UnitQuery = {}): Promise<Unit[]> {
		// An explicit empty id list matches nothing, it must not silently
		// widen into "every unit".
		if (query.ids !== undefined && query.ids.length === 0) {
			return []
		}

		const conditions: SQL[] = []
		if (query.ids !== undefined) {
			conditions.push(inArray(units.id, query.ids))
		}
		if (query.alias !== undefined) {
			conditions.push(eq(units.alias, query.alias))
		}
		if (query.level !== undefined) {
			conditions.push(eq(units.level, query.level))
		}
		if (query.parentId !== undefined) {
			conditions.push(
				query.parentId === null
					? isNull(units.parentId)
					: eq(units.parentId, query.parentId)
			)
		}
		const search = query.search?.trim()
		if (search) {
			const pattern = `%${search}%`
			conditions.push(
				or(like(units.alias, pattern), like(units.name, pattern))!
			)
		}

		const paginate = query.pageSize !== undefined
		const pageSize = paginate ? Math.max(1, query.pageSize!) : undefined
		const offset =
			pageSize !== undefined
				? (Math.max(1, query.page ?? 1) - 1) * pageSize
				: undefined

		return this.db.query.units
			.findMany({
				where: and(...conditions),
				with: relationsToWith(query.with) as never,
				orderBy: asc(units.id),
				limit: pageSize,
				offset
			})
			.catch(handleDatabaseErr) as unknown as Promise<Unit[]>
	}

	async findOne(
		filter: UnitFilter,
		opts?: { with?: UnitRelations }
	): Promise<Unit | undefined> {
		const conditions = Object.entries(filter)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => {
				const column = units[key as keyof UnitFilter]

				return value === null
					? isNull(column)
					: eq(column, value as never)
			})

		if (conditions.length === 0) {
			throw new Error(
				'UnitRepo.findOne: at least one filter field is required'
			)
		}

		return this.db.query.units
			.findFirst({
				where: and(...conditions),
				with: relationsToWith(opts?.with) as never,
				orderBy: asc(units.id)
			})
			.catch(handleDatabaseErr) as unknown as Promise<Unit | undefined>
	}

	// Returns the unit itself plus every ancestor up to the root, nearest
	// first, by walking parentId pointers in memory — mirrors the
	// allUnitEdges pattern in units/stats-repo.ts (unit table is small, no
	// bounded-depth recursive query in sqlite here).
	async findAncestorChain(unitId: number): Promise<UnitDB[]> {
		const all = await this.db.select().from(units)
		const byId = new Map(all.map((u) => [u.id, u]))

		const chain: UnitDB[] = []
		let current = byId.get(unitId)
		while (current !== undefined) {
			chain.push(current)
			current =
				current.parentId !== null && current.parentId !== undefined
					? byId.get(current.parentId)
					: undefined
		}

		return chain
	}
}

const unitRepo = new repo(orm)

export default unitRepo
