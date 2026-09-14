import { and, eq, inArray, isNull, or, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { Repository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	CreateRankPromotionProposalTrooperInput,
	PendingRankPromotionTransition,
	RankPromotionProposal,
	RankPromotionProposalDB,
	RankPromotionProposalItemStatus,
	RankPromotionProposalParams,
	RankPromotionProposalQuery,
	rankPromotionProposalTroopers,
	rankPromotionProposals,
	UpdateRankPromotionProposalMap
} from '../schema/rank-promotion-proposals'
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
		header: RankPromotionProposalParams,
		troopers: CreateRankPromotionProposalTrooperInput[]
	): Promise<RankPromotionProposalDB> {
		log.info('RankPromotionProposalRepo.create params', {
			header,
			troopers
		})

		return this.db
			.transaction(async (tx) => {
				const [created] = await tx
					.insert(rankPromotionProposals)
					.values(header)
					.returning()

				if (troopers.length > 0) {
					await tx.insert(rankPromotionProposalTroopers).values(
						troopers.map((t) => ({
							proposalId: created.id,
							studentId: t.studentId,
							targetRank: t.targetRank ?? null,
							effectiveDate: t.effectiveDate ?? null
						}))
					)
				}

				return created
			})
			.catch(handleDatabaseErr)
	}

	find(query: RankPromotionProposalQuery): Promise<RankPromotionProposal[]> {
		const conditions: SQL[] = []

		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(
				inArray(rankPromotionProposals.unitId, query.unitIds)
			)
		}

		if (query.status !== undefined) {
			conditions.push(eq(rankPromotionProposals.status, query.status))
		}

		if (query.requestedByUserId !== undefined) {
			conditions.push(
				eq(
					rankPromotionProposals.requestedByUserId,
					query.requestedByUserId
				)
			)
		}

		if (query.approverUserId !== undefined) {
			conditions.push(
				eq(rankPromotionProposals.approverUserId, query.approverUserId)
			)
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(rankPromotionProposals.id, query.ids))
		}

		return this.db.query.rankPromotionProposals
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
			RankPromotionProposal[]
		>
	}

	getOne(id: number): Promise<RankPromotionProposal | undefined> {
		return this.db.query.rankPromotionProposals
			.findFirst({
				where: eq(rankPromotionProposals.id, id),
				with: WITH_DETAILS
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			RankPromotionProposal | undefined
		>
	}

	update(
		params: UpdateRankPromotionProposalMap
	): Promise<RankPromotionProposalDB[]> {
		log.info('RankPromotionProposalRepo.update params', { params })

		return this.db
			.transaction(async (tx) => {
				const updated: RankPromotionProposalDB[] = []

				for (const { id, updatePayload } of params) {
					const rows = await tx
						.update(rankPromotionProposals)
						.set(updatePayload)
						.where(eq(rankPromotionProposals.id, id))
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
		itemStatus: RankPromotionProposalItemStatus,
		failureReason?: string
	): Promise<void> {
		await this.db
			.update(rankPromotionProposalTroopers)
			.set({ itemStatus, failureReason: failureReason ?? null })
			.where(eq(rankPromotionProposalTroopers.id, id))
			.catch(handleDatabaseErr)
	}

	async markTrooperApplied(id: number, appliedAt: string): Promise<void> {
		await this.db
			.update(rankPromotionProposalTroopers)
			.set({ itemStatus: 'approved', appliedAt })
			.where(eq(rankPromotionProposalTroopers.id, id))
			.catch(handleDatabaseErr)
	}

	// Approved troopers whose target rank hasn't been pushed to the student
	// yet — candidates for the scheduled-transition sweep to apply once their
	// resolved effectiveDate is reached.
	findPendingApplication(): Promise<PendingRankPromotionTransition[]> {
		return this.db.query.rankPromotionProposalTroopers
			.findMany({
				where: and(
					eq(rankPromotionProposalTroopers.itemStatus, 'approved'),
					isNull(rankPromotionProposalTroopers.appliedAt)
				),
				with: {
					proposal: true,
					student: { columns: { id: true, unitId: true, rank: true } }
				}
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			PendingRankPromotionTransition[]
		>
	}

	// Students already "locked" into a still-live promotion: a pending
	// proposal's items are always pending (approve()/the sweep are the only
	// things that ever set itemStatus, and both happen at/after the header
	// leaves 'pending'), so no itemStatus check is needed for that branch. An
	// approved proposal locks a trooper only until its promotion is actually
	// applied (appliedAt set) - after that the trooper is free to be targeted
	// again (e.g. for a further promotion).
	async findLockedStudentIds(): Promise<number[]> {
		const rows = await this.db
			.selectDistinct({
				studentId: rankPromotionProposalTroopers.studentId
			})
			.from(rankPromotionProposalTroopers)
			.innerJoin(
				rankPromotionProposals,
				eq(
					rankPromotionProposalTroopers.proposalId,
					rankPromotionProposals.id
				)
			)
			.where(
				or(
					eq(rankPromotionProposals.status, 'pending'),
					and(
						eq(rankPromotionProposals.status, 'approved'),
						eq(
							rankPromotionProposalTroopers.itemStatus,
							'approved'
						),
						isNull(rankPromotionProposalTroopers.appliedAt)
					)
				)
			)
			.catch(handleDatabaseErr)

		return rows.map((r) => r.studentId)
	}
}

const rankPromotionProposalRepo = new repo(orm)

export default rankPromotionProposalRepo
