import { and, eq, gte, inArray, lt, notInArray, sql } from 'drizzle-orm'
import orm, { DrizzleDatabase } from '../database'
import { buildings } from '../schema/buildings'
import { rooms } from '../schema/rooms'
import { materialStocks } from '../schema/material-stocks'
import { materialAssets, MaterialAssetStatus } from '../schema/material-assets'
import { materialAssetEvents } from '../schema/material-asset-events'
import { materialTypes } from '../schema/material-types'
import {
	activityStatusProposalTroopers,
	activityStatusProposals
} from '../schema/activity-status-proposals'
import { rankPromotionProposalTroopers } from '../schema/rank-promotion-proposals'
import {
	transferRequestMaterialStocks,
	transferRequestTroopers,
	transferRequests
} from '../schema/transfer-requests'
import { students } from '../schema/student'
import { positions } from '../schema/positions'
import { UnitDB, UnitLevelName, units } from '../schema/units'
import { buildRosterSummary, RosterSummary } from '../export/roster-utils'
import { handleDatabaseErr } from '../utils'
import { UnitStatsRepository } from '.'

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
	troopSummary: RosterSummary
}

// Current state of the weapons (material types in the weapon category) in a
// unit's subtree. Every piece is either handed to a trooper (`assigned`) or
// held by the unit itself (`heldByUnit`, e.g. a crew-served weapon or one
// kept in the armoury), whatever its status, so the two always add up to
// `total`.
export interface WeaponTypeSummary {
	materialTypeId: number
	materialTypeName: string
	total: number
	inService: number
	damaged: number
	lost: number
	retired: number
	assigned: number
	heldByUnit: number
}

// Where the weapons are held: one row per direct sub-unit of the selected
// unit, plus the selected unit itself for pieces it holds directly.
export interface WeaponHolding {
	unitId: number
	unitName: string
	total: number
	inService: number
	assigned: number
	heldByUnit: number
}

export interface WeaponSummary {
	byType: WeaponTypeSummary[]
	byUnit: WeaponHolding[]
}

export interface PeriodStats {
	weaponActivity: {
		assigned: number
		unassigned: number
		transferred: number
		damaged: number
		lost: number
		retired: number
	}
	troopMovement: {
		joined: number
		transferredIn: number
		transferredOut: number
		promoted: number
		discharged: number
		cpvAdmitted: number
	}
	supplyMovement: {
		materialTypeId: number
		materialTypeName: string
		received: number
		sent: number
	}[]
}

class repo implements UnitStatsRepository {
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
			.catch(handleDatabaseErr)
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

	async troopSummary(unitIds: number[]): Promise<RosterSummary> {
		if (unitIds.length === 0) {
			return { total: 0, sq: 0, qncn: 0, hsq: 0, bs: 0 }
		}

		const [studentRows, positionRows] = await Promise.all([
			this.db
				.select({ rank: students.rank, position: students.position })
				.from(students)
				.where(inArray(students.unitId, unitIds)),
			this.db
				.select({
					level: positions.level,
					code: positions.code,
					group: positions.group
				})
				.from(positions)
		])

		return buildRosterSummary(
			studentRows.map((s) => ({
				rank: s.rank ?? '',
				position: s.position ?? ''
			})),
			positionRows.map((p) => ({
				level: p.level,
				code: p.code,
				priority: 0,
				category: p.group
			}))
		)
	}

	async weaponSummary(
		unitIds: number[],
		rootId: number
	): Promise<WeaponSummary> {
		if (unitIds.length === 0) return { byType: [], byUnit: [] }

		const [rows, edges] = await Promise.all([
			this.db
				.select({
					materialTypeId: materialAssets.materialTypeId,
					materialTypeName: materialTypes.name,
					unitId: materialAssets.unitId,
					status: materialAssets.status,
					assigned: sql<number>`${materialAssets.assignedTrooperId} is not null`
				})
				.from(materialAssets)
				.innerJoin(
					materialTypes,
					eq(materialAssets.materialTypeId, materialTypes.id)
				)
				.where(
					and(
						inArray(materialAssets.unitId, unitIds),
						eq(materialTypes.category, 'weapon')
					)
				)
				.catch(handleDatabaseErr),
			this.db
				.select({
					id: units.id,
					name: units.name,
					parentId: units.parentId
				})
				.from(units)
				.catch(handleDatabaseErr)
		])

		// Walk up to the ancestor sitting directly under the selected unit
		// (or the selected unit itself) so holdings roll up one level.
		const byId = new Map(edges.map((e) => [e.id, e]))
		const holderOf = (unitId: number): number => {
			let current = unitId
			while (current !== rootId) {
				const parentId = byId.get(current)?.parentId
				if (parentId === null || parentId === undefined) return rootId
				if (parentId === rootId) return current
				current = parentId
			}
			return rootId
		}

		const byType = new Map<number, WeaponTypeSummary>()
		const byUnit = new Map<number, WeaponHolding>()
		for (const row of rows) {
			const type = byType.get(row.materialTypeId) ?? {
				materialTypeId: row.materialTypeId,
				materialTypeName: row.materialTypeName,
				total: 0,
				inService: 0,
				damaged: 0,
				lost: 0,
				retired: 0,
				assigned: 0,
				heldByUnit: 0
			}
			type.total++
			if (row.status === 'in_service') type.inService++
			if (row.status === 'damaged') type.damaged++
			if (row.status === 'lost') type.lost++
			if (row.status === 'retired') type.retired++
			if (row.assigned) type.assigned++
			else type.heldByUnit++
			byType.set(row.materialTypeId, type)

			const holderId = holderOf(row.unitId)
			const holding = byUnit.get(holderId) ?? {
				unitId: holderId,
				unitName: byId.get(holderId)?.name ?? '',
				total: 0,
				inService: 0,
				assigned: 0,
				heldByUnit: 0
			}
			holding.total++
			if (row.status === 'in_service') holding.inService++
			if (row.assigned) holding.assigned++
			else holding.heldByUnit++
			byUnit.set(holderId, holding)
		}

		return {
			byType: [...byType.values()].sort((a, b) => b.total - a.total),
			byUnit: [...byUnit.values()].sort((a, b) => b.total - a.total)
		}
	}

	// Movement inside [from, toExclusive) - "YYYY-MM-DD" bounds compared as
	// text against the stored timestamps, which are ISO-ordered. Records
	// count for the units in `unitIds` as they are now: an asset or trooper
	// that has since moved out of the subtree is not counted.
	async periodStats(
		unitIds: number[],
		from: string,
		toExclusive: string
	): Promise<PeriodStats> {
		const empty: PeriodStats = {
			weaponActivity: {
				assigned: 0,
				unassigned: 0,
				transferred: 0,
				damaged: 0,
				lost: 0,
				retired: 0
			},
			troopMovement: {
				joined: 0,
				transferredIn: 0,
				transferredOut: 0,
				promoted: 0,
				discharged: 0,
				cpvAdmitted: 0
			},
			supplyMovement: []
		}
		if (unitIds.length === 0) return empty

		const [
			weaponEvents,
			[{ joined }],
			[{ cpvAdmitted }],
			[{ promoted }],
			[{ discharged }],
			troopMoves,
			supplyMoves
		] = await Promise.all([
			this.db
				.select({
					eventType: materialAssetEvents.eventType,
					status: sql<
						string | null
					>`json_extract(${materialAssetEvents.newValue}, '$.status')`,
					count: sql<number>`count(*)`
				})
				.from(materialAssetEvents)
				.innerJoin(
					materialAssets,
					eq(materialAssetEvents.assetId, materialAssets.id)
				)
				.innerJoin(
					materialTypes,
					eq(materialAssets.materialTypeId, materialTypes.id)
				)
				.where(
					and(
						inArray(materialAssets.unitId, unitIds),
						eq(materialTypes.category, 'weapon'),
						gte(materialAssetEvents.createdAt, from),
						lt(materialAssetEvents.createdAt, toExclusive)
					)
				)
				.groupBy(
					materialAssetEvents.eventType,
					sql`json_extract(${materialAssetEvents.newValue}, '$.status')`
				),
			this.db
				.select({ joined: sql<number>`count(*)` })
				.from(students)
				.where(
					and(
						inArray(students.unitId, unitIds),
						gte(students.createdAt, from),
						lt(students.createdAt, toExclusive)
					)
				),
			this.db
				.select({ cpvAdmitted: sql<number>`count(*)` })
				.from(students)
				.where(
					and(
						inArray(students.unitId, unitIds),
						gte(students.cpvOfficialAt, from),
						lt(students.cpvOfficialAt, toExclusive)
					)
				),
			this.db
				.select({ promoted: sql<number>`count(*)` })
				.from(rankPromotionProposalTroopers)
				.innerJoin(
					students,
					eq(rankPromotionProposalTroopers.studentId, students.id)
				)
				.where(
					and(
						inArray(students.unitId, unitIds),
						eq(
							rankPromotionProposalTroopers.itemStatus,
							'approved'
						),
						gte(rankPromotionProposalTroopers.appliedAt, from),
						lt(rankPromotionProposalTroopers.appliedAt, toExclusive)
					)
				),
			this.db
				.select({ discharged: sql<number>`count(*)` })
				.from(activityStatusProposalTroopers)
				.innerJoin(
					activityStatusProposals,
					eq(
						activityStatusProposalTroopers.proposalId,
						activityStatusProposals.id
					)
				)
				.innerJoin(
					students,
					eq(activityStatusProposalTroopers.studentId, students.id)
				)
				.where(
					and(
						inArray(students.unitId, unitIds),
						eq(
							activityStatusProposals.targetActivityStatus,
							'discharged'
						),
						eq(
							activityStatusProposalTroopers.itemStatus,
							'approved'
						),
						gte(activityStatusProposalTroopers.appliedAt, from),
						lt(
							activityStatusProposalTroopers.appliedAt,
							toExclusive
						)
					)
				),
			this.db
				.select({
					direction: sql<
						'in' | 'out'
					>`case when ${inArray(transferRequests.destinationUnitId, unitIds)} then 'in' else 'out' end`,
					count: sql<number>`count(*)`
				})
				.from(transferRequestTroopers)
				.innerJoin(
					transferRequests,
					eq(
						transferRequestTroopers.transferRequestId,
						transferRequests.id
					)
				)
				.where(
					and(
						eq(transferRequests.status, 'approved'),
						eq(transferRequestTroopers.itemStatus, 'approved'),
						gte(transferRequests.decidedAt, from),
						lt(transferRequests.decidedAt, toExclusive),
						sql`(${inArray(transferRequests.destinationUnitId, unitIds)} and ${notInArray(transferRequests.sourceUnitId, unitIds)}) or (${inArray(transferRequests.sourceUnitId, unitIds)} and ${notInArray(transferRequests.destinationUnitId, unitIds)})`
					)
				)
				.groupBy(sql`1`),
			this.db
				.select({
					materialTypeId:
						transferRequestMaterialStocks.materialTypeId,
					materialTypeName: materialTypes.name,
					direction: sql<
						'in' | 'out'
					>`case when ${inArray(transferRequests.destinationUnitId, unitIds)} then 'in' else 'out' end`,
					quantity: sql<number>`sum(${transferRequestMaterialStocks.quantity})`
				})
				.from(transferRequestMaterialStocks)
				.innerJoin(
					transferRequests,
					eq(
						transferRequestMaterialStocks.transferRequestId,
						transferRequests.id
					)
				)
				.innerJoin(
					materialTypes,
					eq(
						transferRequestMaterialStocks.materialTypeId,
						materialTypes.id
					)
				)
				.where(
					and(
						eq(transferRequests.status, 'approved'),
						eq(
							transferRequestMaterialStocks.itemStatus,
							'approved'
						),
						gte(transferRequests.decidedAt, from),
						lt(transferRequests.decidedAt, toExclusive),
						sql`(${inArray(transferRequests.destinationUnitId, unitIds)} and ${notInArray(transferRequests.sourceUnitId, unitIds)}) or (${inArray(transferRequests.sourceUnitId, unitIds)} and ${notInArray(transferRequests.destinationUnitId, unitIds)})`
					)
				)
				.groupBy(
					transferRequestMaterialStocks.materialTypeId,
					materialTypes.name,
					sql`3`
				)
		])

		const weaponActivity = { ...empty.weaponActivity }
		for (const e of weaponEvents) {
			if (e.eventType === 'assigned') weaponActivity.assigned += e.count
			if (e.eventType === 'unassigned')
				weaponActivity.unassigned += e.count
			if (e.eventType === 'transferred')
				weaponActivity.transferred += e.count
			if (e.eventType === 'status_changed') {
				if (e.status === 'damaged') weaponActivity.damaged += e.count
				if (e.status === 'lost') weaponActivity.lost += e.count
				if (e.status === 'retired') weaponActivity.retired += e.count
			}
		}

		const supply = new Map<number, PeriodStats['supplyMovement'][number]>()
		for (const m of supplyMoves) {
			const row = supply.get(m.materialTypeId) ?? {
				materialTypeId: m.materialTypeId,
				materialTypeName: m.materialTypeName,
				received: 0,
				sent: 0
			}
			if (m.direction === 'in') row.received += m.quantity
			else row.sent += m.quantity
			supply.set(m.materialTypeId, row)
		}

		return {
			weaponActivity,
			troopMovement: {
				joined,
				cpvAdmitted,
				promoted,
				discharged,
				transferredIn:
					troopMoves.find((m) => m.direction === 'in')?.count ?? 0,
				transferredOut:
					troopMoves.find((m) => m.direction === 'out')?.count ?? 0
			},
			supplyMovement: [...supply.values()].sort(
				(a, b) => b.received + b.sent - (a.received + a.sent)
			)
		}
	}
}

const unitStatsRepo = new repo(orm)

export default unitStatsRepo
