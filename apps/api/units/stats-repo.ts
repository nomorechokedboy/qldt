import { eq, inArray, sql } from 'drizzle-orm'
import orm, { DrizzleDatabase } from '../database'
import { buildings } from '../schema/buildings'
import { rooms } from '../schema/rooms'
import { materialStocks } from '../schema/material-stocks'
import { materialAssets, MaterialAssetStatus } from '../schema/material-assets'
import { materialTypes } from '../schema/material-types'
import { students } from '../schema/student'
import { UnitDB, UnitLevelName, units } from '../schema/units'

export interface UnitStatsSummary {
	totalStudents: number
	buildingsCount: number
	roomsCount: number
	unitCounts: Partial<Record<UnitLevelName, number>>
	materialStockSummary: {
		materialTypeId: number
		materialTypeName: string
		totalQuantity: number
	}[]
	materialAssetSummary: { status: MaterialAssetStatus; count: number }[]
}

class repo {
	constructor(private readonly db: DrizzleDatabase) {}

	// Returns every unit's id/parentId/level so the caller can walk the
	// hierarchy in memory — there's no bounded-depth way to do this in one
	// SQL query against sqlite here, and the unit table is small.
	private async allUnitEdges(): Promise<
		Pick<UnitDB, 'id' | 'parentId' | 'level'>[]
	> {
		return this.db
			.select({
				id: units.id,
				parentId: units.parentId,
				level: units.level
			})
			.from(units)
	}

	async findDescendantUnitIds(rootId: number): Promise<number[]> {
		const edges = await this.allUnitEdges()
		const childrenByParent = new Map<number, number[]>()
		for (const e of edges) {
			if (e.parentId === null || e.parentId === undefined) continue
			const list = childrenByParent.get(e.parentId) ?? []
			list.push(e.id)
			childrenByParent.set(e.parentId, list)
		}

		const result: number[] = [rootId]
		const queue = [rootId]
		while (queue.length > 0) {
			const current = queue.shift()!
			for (const childId of childrenByParent.get(current) ?? []) {
				result.push(childId)
				queue.push(childId)
			}
		}

		return result
	}

	async unitCountsByLevel(
		descendantUnitIds: number[],
		excludeId: number
	): Promise<Partial<Record<UnitLevelName, number>>> {
		const edges = await this.allUnitEdges()
		const counts: Partial<Record<UnitLevelName, number>> = {}
		for (const e of edges) {
			if (e.id === excludeId) continue
			if (!descendantUnitIds.includes(e.id)) continue
			counts[e.level] = (counts[e.level] ?? 0) + 1
		}
		return counts
	}

	async countStudents(unitIds: number[]): Promise<number> {
		if (unitIds.length === 0) return 0

		const [{ count }] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(students)
			.where(inArray(students.unitId, unitIds))

		return count
	}

	async countBuildings(unitIds: number[]): Promise<number> {
		if (unitIds.length === 0) return 0
		const [{ count }] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(buildings)
			.where(inArray(buildings.unitId, unitIds))
		return count
	}

	async countRooms(unitIds: number[]): Promise<number> {
		if (unitIds.length === 0) return 0
		const [{ count }] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(rooms)
			.where(inArray(rooms.unitId, unitIds))
		return count
	}

	async materialStockSummary(
		unitIds: number[]
	): Promise<UnitStatsSummary['materialStockSummary']> {
		if (unitIds.length === 0) return []

		return this.db
			.select({
				materialTypeId: materialStocks.materialTypeId,
				materialTypeName: materialTypes.name,
				totalQuantity: sql<number>`sum(${materialStocks.quantity})`
			})
			.from(materialStocks)
			.innerJoin(
				materialTypes,
				eq(materialStocks.materialTypeId, materialTypes.id)
			)
			.where(inArray(materialStocks.unitId, unitIds))
			.groupBy(materialStocks.materialTypeId, materialTypes.name)
	}

	async materialAssetSummary(
		unitIds: number[]
	): Promise<UnitStatsSummary['materialAssetSummary']> {
		if (unitIds.length === 0) return []

		return this.db
			.select({
				status: materialAssets.status,
				count: sql<number>`count(*)`
			})
			.from(materialAssets)
			.where(inArray(materialAssets.unitId, unitIds))
			.groupBy(materialAssets.status)
	}
}

const unitStatsRepo = new repo(orm)

export default unitStatsRepo
