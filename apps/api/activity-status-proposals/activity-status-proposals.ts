import { api, Query } from 'encore.dev/api'
import { APICallMeta, currentRequest } from 'encore.dev'
import log from 'encore.dev/log'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import { setAuditContext } from '../middleware/audit'
import {
	ActivityStatusProposal,
	ActivityStatusProposalStatus,
	CreateActivityStatusProposalInput,
	CreateActivityStatusProposalTrooperInput,
	TargetActivityStatus
} from '../schema/activity-status-proposals'
import activityStatusProposalController from './controller'

function requireActorUserId(): number {
	const authData = getAuthData()
	const actorUserId = authData?.userID ? Number(authData.userID) : undefined
	if (actorUserId === undefined) {
		throw AppError.handleAppErr(
			AppError.unauthenticated('Authentication required')
		)
	}
	return actorUserId
}

interface UserSummary {
	id: number
	username: string
	displayName: string
}

interface UnitSummary {
	id: number
	alias: string
	name: string
	level: string
}

interface StudentSummary {
	id: number
	fullName: string | null
	unitId: number | null
}

interface ActivityStatusProposalTrooperItemResp {
	id: number
	itemStatus: string
	failureReason: string | null
	effectiveDate: string | null
	startDate: string | null
	endDate: string | null
	appliedAt: string | null
	revertedAt: string | null
	student?: StudentSummary
}

interface ActivityStatusProposalResp {
	id: number
	status: string
	targetActivityStatus: string
	note: string | null
	rejectionReason: string | null
	decidedAt: string | null
	createdAt: string
	updatedAt: string
	effectiveDate: string | null
	startDate: string | null
	endDate: string | null
	unit?: UnitSummary
	requestedBy?: UserSummary
	approver?: UserSummary
	decidedBy?: UserSummary | null
	troopers?: ActivityStatusProposalTrooperItemResp[]
	canDecide: boolean
}

// Explicit field-by-field mapping (rather than a `{ ...p }` spread) so
// relations carrying sensitive columns — most importantly users.password on
// requestedBy/approver/decidedBy — can never leak onto the wire just because
// a Drizzle `with` clause happened to include them.
function toUserSummary(
	u: { id: number; username: string; displayName: string } | null | undefined
): UserSummary | undefined {
	if (u === null || u === undefined) return undefined
	return { id: u.id, username: u.username, displayName: u.displayName }
}

function toUnitSummary(
	u:
		| { id: number; alias: string; name: string; level: string }
		| null
		| undefined
): UnitSummary | undefined {
	if (u === null || u === undefined) return undefined
	return { id: u.id, alias: u.alias, name: u.name, level: u.level }
}

function toStudentSummary(
	s:
		| { id: number; fullName: string | null; unitId: number | null }
		| null
		| undefined
): StudentSummary | undefined {
	if (s === null || s === undefined) return undefined
	return { id: s.id, fullName: s.fullName, unitId: s.unitId }
}

function toResponse(
	p: ActivityStatusProposal
): Omit<ActivityStatusProposalResp, 'canDecide'> {
	return {
		id: p.id,
		status: p.status,
		targetActivityStatus: p.targetActivityStatus,
		note: p.note,
		rejectionReason: p.rejectionReason,
		decidedAt: p.decidedAt,
		createdAt: p.createdAt ?? '',
		updatedAt: p.updatedAt ?? '',
		effectiveDate: p.effectiveDate,
		startDate: p.startDate,
		endDate: p.endDate,
		unit: toUnitSummary(p.unit),
		requestedBy: toUserSummary(p.requestedBy),
		approver: toUserSummary(p.approver),
		decidedBy: toUserSummary(p.decidedBy) ?? null,
		troopers: p.troopers?.map((t) => ({
			id: t.id,
			itemStatus: t.itemStatus,
			failureReason: t.failureReason,
			effectiveDate: t.effectiveDate,
			startDate: t.startDate,
			endDate: t.endDate,
			appliedAt: t.appliedAt,
			revertedAt: t.revertedAt,
			student: toStudentSummary(t.student)
		}))
	}
}

// Whether the given actor is the specific user chosen as this proposal's
// approver — i.e. whether the approve/reject buttons should show for this
// specific proposal, independent of the org-wide
// activity_status_proposals:approve/reject permission.
async function toResponseWithCanDecide(
	p: ActivityStatusProposal,
	actorUserId: number
): Promise<ActivityStatusProposalResp> {
	const canDecide = p.status === 'pending' && p.approver?.id === actorUserId
	return { ...toResponse(p), canDecide }
}

function withCanDecide(
	ps: ActivityStatusProposal[],
	actorUserId: number
): Promise<ActivityStatusProposalResp[]> {
	return Promise.all(ps.map((p) => toResponseWithCanDecide(p, actorUserId)))
}

interface CreateActivityStatusProposalBody {
	unitId: number
	approverUserId: number
	targetActivityStatus: TargetActivityStatus
	note?: string | null
	effectiveDate?: string | null
	startDate?: string | null
	endDate?: string | null
	troopers: CreateActivityStatusProposalTrooperInput[]
}

interface CreateActivityStatusProposalResponse {
	data: ActivityStatusProposalResp
}

export const CreateActivityStatusProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/activity-status-proposals'
	},
	async (
		body: CreateActivityStatusProposalBody
	): Promise<CreateActivityStatusProposalResponse> => {
		const actorUserId = requireActorUserId()

		const input: CreateActivityStatusProposalInput = { ...body }
		const created = await activityStatusProposalController.create(
			input,
			actorUserId
		)

		setAuditContext({
			resourceIds: [created.id],
			newValue: created
		})

		return { data: await toResponseWithCanDecide(created, actorUserId) }
	}
)

export interface GetActivityStatusProposalsQuery {
	status?: ActivityStatusProposalStatus
}

interface GetActivityStatusProposalsResponse {
	data: ActivityStatusProposalResp[]
}

export const GetActivityStatusProposals = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/activity-status-proposals'
	},
	async (
		q: GetActivityStatusProposalsQuery
	): Promise<GetActivityStatusProposalsResponse> => {
		const actorUserId = requireActorUserId()
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await activityStatusProposalController.find({
			unitIds: validUnitIds,
			status: q.status
		})

		return { data: await withCanDecide(data, actorUserId) }
	}
)

interface GetActivityStatusProposalEligibleApproversQuery {
	unitId: Query<number>
}

interface GetActivityStatusProposalEligibleApproversResponse {
	data: UserSummary[]
}

// Users eligible to approve a proposal raised from the given unit —
// commanders/deputy commanders/political commanders/deputy political
// commanders of the unit itself or any of its ancestors. Used to populate
// the approver picker with only valid choices.
export const GetActivityStatusProposalEligibleApprovers = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/activity-status-proposals/eligible-approvers'
	},
	async (
		q: GetActivityStatusProposalEligibleApproversQuery
	): Promise<GetActivityStatusProposalEligibleApproversResponse> => {
		const users =
			await activityStatusProposalController.listEligibleApprovers(
				q.unitId
			)
		return {
			data: users.map((u) => ({
				id: u.id,
				username: u.username,
				displayName: u.displayName
			}))
		}
	}
)

interface GetActivityStatusProposalParams {
	id: number
}

interface GetActivityStatusProposalResponse {
	data: ActivityStatusProposalResp
}

export const GetActivityStatusProposal = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/activity-status-proposals/:id'
	},
	async ({
		id
	}: GetActivityStatusProposalParams): Promise<GetActivityStatusProposalResponse> => {
		const actorUserId = requireActorUserId()
		const data = await activityStatusProposalController.findOne(id)
		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)

interface ApproveActivityStatusProposalParams {
	id: number
}

interface ApproveActivityStatusProposalResponse {
	data: ActivityStatusProposalResp
}

export const ApproveActivityStatusProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/activity-status-proposals/:id/approve'
	},
	async ({
		id
	}: ApproveActivityStatusProposalParams): Promise<ApproveActivityStatusProposalResponse> => {
		const actorUserId = requireActorUserId()
		const before = await activityStatusProposalController.findOne(id)

		const data = await activityStatusProposalController.approve(
			id,
			actorUserId
		)

		setAuditContext({
			resourceIds: [id],
			previousValue: before,
			newValue: data
		})

		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)

// Triggered externally (k8s CronJob hitting this over the internal
// network), same convention as GET /commander-digest/cron and
// GET /students/cron - no `auth: true`. Applies due status transitions
// (effectiveDate/startDate reached) and reverts due windows (endDate
// reached) for already-approved troopers. Not gated by a shared secret,
// same as the other cron endpoints.
export const ActivityStatusProposalCron = api(
	{ expose: false, method: 'GET', path: '/activity-status-proposals/cron' },
	async (): Promise<{ ok: true }> => {
		log.info('ActivityStatusProposalCron triggered')
		await activityStatusProposalController.runScheduledTransitions()
		log.info('ActivityStatusProposalCron complete')
		return { ok: true }
	}
)

interface RejectActivityStatusProposalRequest {
	id: number
	reason: string
}

interface RejectActivityStatusProposalResponse {
	data: ActivityStatusProposalResp
}

export const RejectActivityStatusProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/activity-status-proposals/:id/reject'
	},
	async ({
		id,
		reason
	}: RejectActivityStatusProposalRequest): Promise<RejectActivityStatusProposalResponse> => {
		const actorUserId = requireActorUserId()
		if (!reason || reason.trim().length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('A rejection reason is required')
			)
		}
		const before = await activityStatusProposalController.findOne(id)

		const data = await activityStatusProposalController.reject(
			id,
			actorUserId,
			reason
		)

		setAuditContext({
			resourceIds: [id],
			previousValue: before,
			newValue: data
		})

		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)

interface CancelActivityStatusProposalParams {
	id: number
}

interface CancelActivityStatusProposalResponse {
	data: ActivityStatusProposalResp
}

export const CancelActivityStatusProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/activity-status-proposals/:id/cancel'
	},
	async ({
		id
	}: CancelActivityStatusProposalParams): Promise<CancelActivityStatusProposalResponse> => {
		const actorUserId = requireActorUserId()
		const before = await activityStatusProposalController.findOne(id)

		const data = await activityStatusProposalController.cancel(
			id,
			actorUserId
		)

		setAuditContext({
			resourceIds: [id],
			previousValue: before,
			newValue: data
		})

		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)
