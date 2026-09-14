import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import { StudentDB, students } from './student'
import { Unit, units } from './units'
import { UserDB, users } from './users'

export type RankPromotionProposalStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'cancelled'

const rankPromotionProposalStatuses: RankPromotionProposalStatus[] = [
	'pending',
	'approved',
	'rejected',
	'cancelled'
]

const RankPromotionProposalStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (
			!rankPromotionProposalStatuses.includes(
				val as RankPromotionProposalStatus
			)
		) {
			throw AppError.invalidArgument(
				`status must be one of ${rankPromotionProposalStatuses.join(', ')}`
			)
		}
		return val
	}
})

// Per-line-item status: a trooper can become ineligible between proposal
// creation and approval (e.g. transferred out of the unit), so the batch can
// partially fail without failing the whole proposal.
export type RankPromotionProposalItemStatus = 'pending' | 'approved' | 'failed'

const rankPromotionProposalItemStatuses: RankPromotionProposalItemStatus[] = [
	'pending',
	'approved',
	'failed'
]

const RankPromotionProposalItemStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (
			!rankPromotionProposalItemStatuses.includes(
				val as RankPromotionProposalItemStatus
			)
		) {
			throw AppError.invalidArgument(
				`itemStatus must be one of ${rankPromotionProposalItemStatuses.join(', ')}`
			)
		}
		return val
	}
})

export const rankPromotionProposals = sqlite.sqliteTable(
	'rank_promotion_proposals',
	{
		...baseSchema,
		unitId: sqlite
			.int()
			.notNull()
			.references((): sqlite.AnySQLiteColumn => units.id),
		requestedByUserId: sqlite
			.int()
			.notNull()
			.references((): sqlite.AnySQLiteColumn => users.id),
		approverUserId: sqlite
			.int()
			.notNull()
			.references((): sqlite.AnySQLiteColumn => users.id),
		decidedByUserId: sqlite
			.int()
			.references((): sqlite.AnySQLiteColumn => users.id),
		decidedAt: sqlite.text(),
		status: RankPromotionProposalStatusEnum('status')
			.$type<RankPromotionProposalStatus>()
			.default('pending')
			.notNull(),
		// Batch-wide default target rank (free text, same convention as
		// students.rank — validated against the known rank list and
		// forward-only progression in the controller, not a DB-level enum). A
		// trooper line item may override this — see
		// rankPromotionProposalTroopers below.
		targetRank: sqlite.text().notNull(),
		rejectionReason: sqlite.text(),
		note: sqlite.text(),
		// Batch-wide default for when the promotion takes effect ("YYYY-MM-DD",
		// same date-only convention as students.dob). A promotion is a one-off,
		// permanent change — unlike activity-status-proposals there is no
		// ranged startDate/endDate or revert.
		effectiveDate: sqlite.text()
	}
)

export const rankPromotionProposalTroopers = sqlite.sqliteTable(
	'rank_promotion_proposal_troopers',
	{
		...baseSchema,
		proposalId: sqlite
			.int()
			.notNull()
			.references(() => rankPromotionProposals.id),
		studentId: sqlite
			.int()
			.notNull()
			.references(() => students.id),
		itemStatus: RankPromotionProposalItemStatusEnum('itemStatus')
			.$type<RankPromotionProposalItemStatus>()
			.default('pending')
			.notNull(),
		failureReason: sqlite.text(),
		// Per-trooper override of the proposal's targetRank/effectiveDate —
		// null means "use the proposal's value".
		targetRank: sqlite.text(),
		effectiveDate: sqlite.text(),
		// Execution timing, distinct from itemStatus (the approval decision):
		// appliedAt is stamped when the target rank was actually pushed to the
		// student (at approval time if already due, otherwise by the
		// scheduled sweep once effectiveDate arrives). Nothing ever reverts a
		// promotion, so there is no revertedAt.
		appliedAt: sqlite.text()
	}
)

export const rankPromotionProposalTroopersRelations = relations(
	rankPromotionProposalTroopers,
	({ one }) => ({
		proposal: one(rankPromotionProposals, {
			fields: [rankPromotionProposalTroopers.proposalId],
			references: [rankPromotionProposals.id]
		}),
		student: one(students, {
			fields: [rankPromotionProposalTroopers.studentId],
			references: [students.id]
		})
	})
)

export const rankPromotionProposalsRelations = relations(
	rankPromotionProposals,
	({ one, many }) => ({
		unit: one(units, {
			fields: [rankPromotionProposals.unitId],
			references: [units.id]
		}),
		requestedBy: one(users, {
			fields: [rankPromotionProposals.requestedByUserId],
			references: [users.id],
			relationName: 'rankPromotionProposalRequestedBy'
		}),
		approver: one(users, {
			fields: [rankPromotionProposals.approverUserId],
			references: [users.id],
			relationName: 'rankPromotionProposalApprover'
		}),
		decidedBy: one(users, {
			fields: [rankPromotionProposals.decidedByUserId],
			references: [users.id],
			relationName: 'rankPromotionProposalDecidedBy'
		}),
		troopers: many(rankPromotionProposalTroopers)
	})
)

export type RankPromotionProposalDB = InferSelectModel<
	typeof rankPromotionProposals
>
export type RankPromotionProposalParams = InferInsertModel<
	typeof rankPromotionProposals
>

export type RankPromotionProposalTrooperDB = InferSelectModel<
	typeof rankPromotionProposalTroopers
>
export type RankPromotionProposalTrooperParams = InferInsertModel<
	typeof rankPromotionProposalTroopers
>

type rankPromotionProposal = Omit<
	RankPromotionProposalDB,
	'unitId' | 'requestedByUserId' | 'approverUserId' | 'decidedByUserId'
>

export type RankPromotionProposal = rankPromotionProposal & {
	unit?: Unit
	requestedBy?: UserDB
	approver?: UserDB
	decidedBy?: UserDB | null
	troopers?: RankPromotionProposalTrooper[]
}

type rankPromotionProposalTrooper = Omit<
	RankPromotionProposalTrooperDB,
	'proposalId' | 'studentId'
>

export type RankPromotionProposalTrooper = rankPromotionProposalTrooper & {
	student?: StudentDB
}

// Row shape returned by the scheduled-transition sweep's query — a trooper
// line item joined with its parent proposal (to read targetRank and the
// header-level effectiveDate fallback) and a minimal student projection
// (just enough to know it still exists).
export type PendingRankPromotionTransition = RankPromotionProposalTrooperDB & {
	proposal: RankPromotionProposalDB
	student: { id: number; unitId: number | null; rank: string | null } | null
}

export type RankPromotionProposalQuery = {
	unitIds?: number[]
	status?: RankPromotionProposalStatus
	requestedByUserId?: number
	approverUserId?: number
	ids?: number[]
}

export type UpdateRankPromotionProposalMap = {
	id: number
	updatePayload: Partial<{
		status: RankPromotionProposalStatus
		decidedByUserId: number | null
		decidedAt: string | null
		rejectionReason: string | null
	}>
}[]

export type CreateRankPromotionProposalTrooperInput = {
	studentId: number
	targetRank?: string | null
	effectiveDate?: string | null
}

export type CreateRankPromotionProposalInput = {
	unitId: number
	approverUserId: number
	targetRank: string
	note?: string | null
	effectiveDate?: string | null
	troopers: CreateRankPromotionProposalTrooperInput[]
}
