import { and, eq, inArray, isNotNull, isNull, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { Repository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	ActivityStatusProposal,
	ActivityStatusProposalDB,
	ActivityStatusProposalItemStatus,
	ActivityStatusProposalParams,
	ActivityStatusProposalQuery,
	activityStatusProposalTroopers,
	activityStatusProposals,
	CreateActivityStatusProposalTrooperInput,
	PendingTrooperTransition,
	UpdateActivityStatusProposalMap
} from '../schema/activity-status-proposals'
import { handleDatabaseErr } from '../utils'

const WITH_DETAILS = {
	unit: {
		with: { parent: true, commander: { columns: { password: false } } }
	},
	requestedBy: { columns: { password: false } },
	approver: { columns: { password: false } },
	decidedBy: { columns: { password: false } },
	troopers: { with: { student: true } }
} as const

class repo implements Repository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(
		header: ActivityStatusProposalParams,
		troopers: CreateActivityStatusProposalTrooperInput[]
	): Promise<ActivityStatusProposalDB> {
		log.info('ActivityStatusProposalRepo.create params', {
			header,
			troopers
		})

		return this.db
			.transaction(async (tx) => {
				const [created] = await tx
					.insert(activityStatusProposals)
					.values(header)
					.returning()

				if (troopers.length > 0) {
					await tx.insert(activityStatusProposalTroopers).values(
						troopers.map((t) => ({
							proposalId: created.id,
							studentId: t.studentId,
							effectiveDate: t.effectiveDate ?? null,
							startDate: t.startDate ?? null,
							endDate: t.endDate ?? null
						}))
					)
				}

				return created
			})
			.catch(handleDatabaseErr)
	}

	find(
		query: ActivityStatusProposalQuery
	): Promise<ActivityStatusProposal[]> {
		const conditions: SQL[] = []

		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(
				inArray(activityStatusProposals.unitId, query.unitIds)
			)
		}

		if (query.status !== undefined) {
			conditions.push(eq(activityStatusProposals.status, query.status))
		}

		if (query.requestedByUserId !== undefined) {
			conditions.push(
				eq(
					activityStatusProposals.requestedByUserId,
					query.requestedByUserId
				)
			)
		}

		if (query.approverUserId !== undefined) {
			conditions.push(
				eq(activityStatusProposals.approverUserId, query.approverUserId)
			)
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(activityStatusProposals.id, query.ids))
		}

		return this.db.query.activityStatusProposals
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: WITH_DETAILS,
				orderBy: (t, { desc }) => [desc(t.createdAt)]
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			ActivityStatusProposal[]
		>
	}

	getOne(id: number): Promise<ActivityStatusProposal | undefined> {
		return this.db.query.activityStatusProposals
			.findFirst({
				where: eq(activityStatusProposals.id, id),
				with: WITH_DETAILS
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			ActivityStatusProposal | undefined
		>
	}

	update(
		params: UpdateActivityStatusProposalMap
	): Promise<ActivityStatusProposalDB[]> {
		log.info('ActivityStatusProposalRepo.update params', { params })

		return this.db
			.transaction(async (tx) => {
				const updated: ActivityStatusProposalDB[] = []

				for (const { id, updatePayload } of params) {
					const rows = await tx
						.update(activityStatusProposals)
						.set(updatePayload)
						.where(eq(activityStatusProposals.id, id))
						.returning()

					if (rows.length > 0) {
						updated.push(rows[0])
					}
				}

				return updated
			})
			.catch(handleDatabaseErr)
	}

	async setTrooperItemStatus(
		id: number,
		itemStatus: ActivityStatusProposalItemStatus,
		failureReason?: string
	): Promise<void> {
		await this.db
			.update(activityStatusProposalTroopers)
			.set({ itemStatus, failureReason: failureReason ?? null })
			.where(eq(activityStatusProposalTroopers.id, id))
			.catch(handleDatabaseErr)
	}

	async markTrooperApplied(id: number, appliedAt: string): Promise<void> {
		await this.db
			.update(activityStatusProposalTroopers)
			.set({ itemStatus: 'approved', appliedAt })
			.where(eq(activityStatusProposalTroopers.id, id))
			.catch(handleDatabaseErr)
	}

	async markTrooperReverted(id: number, revertedAt: string): Promise<void> {
		await this.db
			.update(activityStatusProposalTroopers)
			.set({ revertedAt })
			.where(eq(activityStatusProposalTroopers.id, id))
			.catch(handleDatabaseErr)
	}

	// Approved troopers whose target status hasn't been pushed to the
	// student yet — candidates for the scheduled-transition sweep to apply
	// once their resolved effectiveDate/startDate is reached.
	findPendingApplication(): Promise<PendingTrooperTransition[]> {
		return this.db.query.activityStatusProposalTroopers
			.findMany({
				where: and(
					eq(activityStatusProposalTroopers.itemStatus, 'approved'),
					isNull(activityStatusProposalTroopers.appliedAt)
				),
				with: {
					proposal: true,
					student: { columns: { id: true, unitId: true } }
				}
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			PendingTrooperTransition[]
		>
	}

	// Applied troopers on a ranged target status whose endDate hasn't been
	// reverted to 'serving' yet — candidates for the scheduled-transition
	// sweep once their resolved endDate is reached.
	findPendingRevert(): Promise<PendingTrooperTransition[]> {
		return this.db.query.activityStatusProposalTroopers
			.findMany({
				where: and(
					eq(activityStatusProposalTroopers.itemStatus, 'approved'),
					isNotNull(activityStatusProposalTroopers.appliedAt),
					isNull(activityStatusProposalTroopers.revertedAt)
				),
				with: {
					proposal: true,
					student: { columns: { id: true, unitId: true } }
				}
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			PendingTrooperTransition[]
		>
	}
}

const activityStatusProposalRepo = new repo(orm)

export default activityStatusProposalRepo
