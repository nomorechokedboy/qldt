// repo.ts
import orm, { DrizzleDatabase } from '../database'
import type {
	Repository as UnitRepository,
	UnitStatsRepository
} from '../units'
import unitStatsRepo, { UnitStatsSummary } from '../units/stats-repo'
import type { Repository as TransferReqRepository } from '../transfer-requests'
import type { MaterialAssetRepository } from '../materials'
import type { Repository as StudentRepo } from '../students'
import type { AuditLogRepository } from '../audit-logs'
import unitRepo from '../units/repo'
import transferRequestRepo from '../transfer-requests/repo'
import materialAssetRepo from '../materials/material-assets-repo'
import studentRepo from '../students/repo'
import auditLogRepo from '../audit-logs/repo'
import { Unit } from '../schema/units'
import { MaterialAsset } from '../schema/material-assets'
import { Student } from '../schema/student'
import { TransferRequest } from '../schema/transfer-requests'
import { AuditLog } from '../schema/audit-logs'

export interface UnitDigestSnapshot extends UnitStatsSummary {
	unit: Unit
	descendantUnitIds: number[]
	damagedAssets: MaterialAsset[]
	needMaintenanceAssets: MaterialAsset[]
	thisWeekBirthdayStudents: Student[]
	// thisWeekCpvOfficialStudents: Student[] // TODO: wire once you add the cpv-official-this-week query
	recentChanges: AuditLog[]
}

const RECENT_CHANGES_LOOKBACK_DAYS = 7
const RECENT_CHANGES_RESOURCES = [
	'students',
	'material_assets',
	'transfer_requests'
] as const

class repo {
	constructor(
		private readonly db: DrizzleDatabase,
		private readonly unitRepo: UnitRepository,
		private readonly unitStatsRepo: UnitStatsRepository,
		private readonly transferReqRepo: TransferReqRepository,
		private readonly materialAssetRepo: MaterialAssetRepository,
		private readonly studentRepo: StudentRepo,
		private readonly auditLogRepo: AuditLogRepository
	) {}

	async getDigestUnits(): Promise<Unit[]> {
		return this.unitRepo
			.find({})
			.then((units) =>
				units.filter(
					(u) =>
						u.commanderId !== null ||
						u.deputyCommanderId !== null ||
						u.politicalCommanderId !== null ||
						u.deputyPoliticalCommanderId !== null
				)
			)
	}

	// Dedup in case one person somehow holds two roles on the same unit -
	// they should get one digest, not two.
	getRecipientIds(unit: Unit): number[] {
		return [
			...new Set(
				[
					unit.commanderId,
					unit.deputyCommanderId,
					unit.politicalCommanderId,
					unit.deputyPoliticalCommanderId
				].filter((id): id is number => id !== null && id !== undefined)
			)
		]
	}

	async gatherUnitSnapshot(unit: Unit): Promise<UnitDigestSnapshot> {
		const descendantUnitIds =
			await this.unitStatsRepo.findDescendantUnitIds(unit.id)

		const [
			totalStudents,
			buildingsCount,
			roomsCount,
			unitCounts,
			materialStockSummary,
			materialAssetSummary,
			troopSummary,
			damagedAssets,
			needMaintenanceAssets,
			thisWeekBirthdayStudents,
			recentChanges
		] = await Promise.all([
			this.unitStatsRepo.countStudents(descendantUnitIds),
			this.unitStatsRepo.countBuildings(descendantUnitIds),
			this.unitStatsRepo.countRooms(descendantUnitIds),
			this.unitStatsRepo.unitCountsByLevel(descendantUnitIds, unit.id),
			this.unitStatsRepo.materialStockSummary(descendantUnitIds),
			this.unitStatsRepo.materialAssetSummary(descendantUnitIds),
			this.unitStatsRepo.troopSummary(descendantUnitIds),
			this.materialAssetRepo.find({
				unitIds: descendantUnitIds,
				condition: 'damaged'
			}),
			this.materialAssetRepo.find({
				unitIds: descendantUnitIds,
				condition: 'needs_maintenance'
			}),
			this.studentRepo.find({
				unitIds: descendantUnitIds,
				birthdayInWeek: true
			}),
			this.gatherRecentChanges(descendantUnitIds)
		])

		return {
			unit,
			descendantUnitIds,
			totalStudents,
			buildingsCount,
			roomsCount,
			unitCounts,
			materialStockSummary,
			materialAssetSummary,
			troopSummary,
			damagedAssets,
			needMaintenanceAssets,
			thisWeekBirthdayStudents,
			recentChanges
		}
	}

	// Pending approvals belong to a PERSON (approverUserId), not a unit -
	// fetched per recipient. Never call this with an undefined id: the
	// underlying find() silently drops the filter and returns every
	// pending request system-wide (see bug this replaces).
	async gatherPendingApprovals(
		approverUserId: number
	): Promise<TransferRequest[]> {
		return this.transferReqRepo.find({ approverUserId, status: 'pending' })
	}

	// Best-effort: audit_logs has no unitId column, so this pulls a bounded
	// recent window per watched resource and filters in memory to rows
	// whose resourceIds land inside this unit's own student/asset ids.
	// transfer_requests has no cheap id-set to check here, so those are
	// included unfiltered - volume is naturally low (approval workflow,
	// not bulk data). Revisit with a denormalized unitId column on
	// audit_logs if precision matters later.
	private async gatherRecentChanges(
		descendantUnitIds: number[]
	): Promise<AuditLog[]> {
		const from = new Date(
			Date.now() - RECENT_CHANGES_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
		).toISOString()

		const [studentsInUnit, assetsInUnit] = await Promise.all([
			this.studentRepo.find({ unitIds: descendantUnitIds }),
			this.materialAssetRepo.find({ unitIds: descendantUnitIds })
		])
		const idsByResource: Partial<Record<string, Set<number>>> = {
			students: new Set(studentsInUnit.map((s) => s.id)),
			material_assets: new Set(assetsInUnit.map((a) => a.id))
		}

		const results = await Promise.all(
			RECENT_CHANGES_RESOURCES.map((resource) =>
				this.auditLogRepo.find({ resource, from, pageSize: 100 })
			)
		)

		return results.flatMap(({ data }, i) => {
			const relevantIds = idsByResource[RECENT_CHANGES_RESOURCES[i]]
			if (relevantIds === undefined) return data
			return data.filter((log) =>
				log.resourceIds?.some((id) => relevantIds.has(Number(id)))
			)
		})
	}
}

const commanderDigestRepo = new repo(
	orm,
	unitRepo,
	unitStatsRepo,
	transferRequestRepo,
	materialAssetRepo,
	studentRepo,
	auditLogRepo
)

export default commanderDigestRepo
