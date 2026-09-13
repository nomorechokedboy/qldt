import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import { StudentDB, students } from './student'
import { Unit, units } from './units'
import { UserDB, users } from './users'

export type ActivityStatusProposalStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'cancelled'

const activityStatusProposalStatuses: ActivityStatusProposalStatus[] = [
	'pending',
	'approved',
	'rejected',
	'cancelled'
]

const ActivityStatusProposalStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (
			!activityStatusProposalStatuses.includes(
				val as ActivityStatusProposalStatus
			)
		) {
			throw AppError.invalidArgument(
				`status must be one of ${activityStatusProposalStatuses.join(', ')}`
			)
		}
		return val
	}
})

// Per-line-item status: a trooper can become ineligible between proposal
// creation and approval (e.g. already discharged by another request), so
// the batch can partially fail without failing the whole proposal.
export type ActivityStatusProposalItemStatus = 'pending' | 'approved' | 'failed'

const activityStatusProposalItemStatuses: ActivityStatusProposalItemStatus[] = [
	'pending',
	'approved',
	'failed'
]

const ActivityStatusProposalItemStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (
			!activityStatusProposalItemStatuses.includes(
				val as ActivityStatusProposalItemStatus
			)
		) {
			throw AppError.invalidArgument(
				`itemStatus must be one of ${activityStatusProposalItemStatuses.join(', ')}`
			)
		}
		return val
	}
})

// Only these 4 of the 9 activityStatus values are things a commander can
// propose a batch of troopers into — the rest (serving, hospitalized,
// infirmary_treatment, contest, business_trip) reflect current unplanned
// state rather than something requiring a higher commander's approval.
export type TargetActivityStatus =
	| 'annual_leave'
	| 'discharged'
	| 'weekly_leave'
	| 'rehearsal'

const targetActivityStatuses: TargetActivityStatus[] = [
	'annual_leave',
	'discharged',
	'weekly_leave',
	'rehearsal'
]

const TargetActivityStatusEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!targetActivityStatuses.includes(val as TargetActivityStatus)) {
			throw AppError.invalidArgument(
				`targetActivityStatus must be one of ${targetActivityStatuses.join(', ')}`
			)
		}
		return val
	}
})

export const activityStatusProposals = sqlite.sqliteTable(
	'activity_status_proposals',
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
		status: ActivityStatusProposalStatusEnum('status')
			.$type<ActivityStatusProposalStatus>()
			.default('pending')
			.notNull(),
		targetActivityStatus: TargetActivityStatusEnum('targetActivityStatus')
			.$type<TargetActivityStatus>()
			.notNull(),
		rejectionReason: sqlite.text(),
		note: sqlite.text()
	}
)

export const activityStatusProposalTroopers = sqlite.sqliteTable(
	'activity_status_proposal_troopers',
	{
		...baseSchema,
		proposalId: sqlite
			.int()
			.notNull()
			.references(() => activityStatusProposals.id),
		studentId: sqlite
			.int()
			.notNull()
			.references(() => students.id),
		itemStatus: ActivityStatusProposalItemStatusEnum('itemStatus')
			.$type<ActivityStatusProposalItemStatus>()
			.default('pending')
			.notNull(),
		failureReason: sqlite.text()
	}
)

export const activityStatusProposalTroopersRelations = relations(
	activityStatusProposalTroopers,
	({ one }) => ({
		proposal: one(activityStatusProposals, {
			fields: [activityStatusProposalTroopers.proposalId],
			references: [activityStatusProposals.id]
		}),
		student: one(students, {
			fields: [activityStatusProposalTroopers.studentId],
			references: [students.id]
		})
	})
)

export const activityStatusProposalsRelations = relations(
	activityStatusProposals,
	({ one, many }) => ({
		unit: one(units, {
			fields: [activityStatusProposals.unitId],
			references: [units.id]
		}),
		requestedBy: one(users, {
			fields: [activityStatusProposals.requestedByUserId],
			references: [users.id],
			relationName: 'activityStatusProposalRequestedBy'
		}),
		approver: one(users, {
			fields: [activityStatusProposals.approverUserId],
			references: [users.id],
			relationName: 'activityStatusProposalApprover'
		}),
		decidedBy: one(users, {
			fields: [activityStatusProposals.decidedByUserId],
			references: [users.id],
			relationName: 'activityStatusProposalDecidedBy'
		}),
		troopers: many(activityStatusProposalTroopers)
	})
)

export type ActivityStatusProposalDB = InferSelectModel<
	typeof activityStatusProposals
>
export type ActivityStatusProposalParams = InferInsertModel<
	typeof activityStatusProposals
>

export type ActivityStatusProposalTrooperDB = InferSelectModel<
	typeof activityStatusProposalTroopers
>
export type ActivityStatusProposalTrooperParams = InferInsertModel<
	typeof activityStatusProposalTroopers
>

type activityStatusProposal = Omit<
	ActivityStatusProposalDB,
	'unitId' | 'requestedByUserId' | 'approverUserId' | 'decidedByUserId'
>

export type ActivityStatusProposal = activityStatusProposal & {
	unit?: Unit
	requestedBy?: UserDB
	approver?: UserDB
	decidedBy?: UserDB | null
	troopers?: ActivityStatusProposalTrooper[]
}

type activityStatusProposalTrooper = Omit<
	ActivityStatusProposalTrooperDB,
	'proposalId' | 'studentId'
>

export type ActivityStatusProposalTrooper = activityStatusProposalTrooper & {
	student?: StudentDB
}

export type ActivityStatusProposalQuery = {
	unitIds?: number[]
	status?: ActivityStatusProposalStatus
	requestedByUserId?: number
	approverUserId?: number
	ids?: number[]
}

export type UpdateActivityStatusProposalMap = {
	id: number
	updatePayload: Partial<{
		status: ActivityStatusProposalStatus
		decidedByUserId: number | null
		decidedAt: string | null
		rejectionReason: string | null
	}>
}[]

export type CreateActivityStatusProposalTrooperInput = {
	studentId: number
}

export type CreateActivityStatusProposalInput = {
	unitId: number
	approverUserId: number
	targetActivityStatus: TargetActivityStatus
	note?: string | null
	troopers: CreateActivityStatusProposalTrooperInput[]
}
