import { api, Query } from 'encore.dev/api'
import { APICallMeta, currentRequest } from 'encore.dev'
import log from 'encore.dev/log'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import { setAuditContext } from '../middleware/audit'
import {
	CreateRankPromotionProposalInput,
	CreateRankPromotionProposalTrooperInput,
	RankPromotionProposal,
	RankPromotionProposalStatus
} from '../schema/rank-promotion-proposals'
import rankPromotionProposalController from './controller'

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

interface RankPromotionProposalTrooperItemResp {
	id: number
	itemStatus: string
	failureReason: string | null
	targetRank: string | null
	effectiveDate: string | null
	appliedAt: string | null
	student?: StudentSummary
}

interface RankPromotionProposalResp {
	id: number
	status: string
	targetRank: string
	note: string | null
	rejectionReason: string | null
	decidedAt: string | null
	createdAt: string
	updatedAt: string
	effectiveDate: string | null
	unit?: UnitSummary
	requestedBy?: UserSummary
	approver?: UserSummary
	decidedBy?: UserSummary | null
	troopers?: RankPromotionProposalTrooperItemResp[]
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
	p: RankPromotionProposal
): Omit<RankPromotionProposalResp, 'canDecide'> {
	return {
		id: p.id,
		status: p.status,
		targetRank: p.targetRank,
		note: p.note,
		rejectionReason: p.rejectionReason,
		decidedAt: p.decidedAt,
		createdAt: p.createdAt ?? '',
		updatedAt: p.updatedAt ?? '',
		effectiveDate: p.effectiveDate,
		unit: toUnitSummary(p.unit),
		requestedBy: toUserSummary(p.requestedBy),
		approver: toUserSummary(p.approver),
		decidedBy: toUserSummary(p.decidedBy) ?? null,
		troopers: p.troopers?.map((t) => ({
			id: t.id,
			itemStatus: t.itemStatus,
			failureReason: t.failureReason,
			targetRank: t.targetRank,
			effectiveDate: t.effectiveDate,
			appliedAt: t.appliedAt,
			student: toStudentSummary(t.student)
		}))
	}
}

// Whether the given actor currently holds one of the 4 leadership roles on
// the proposal's unit or one of its ancestors — i.e. whether the
// approve/reject buttons should show for this specific proposal,
// independent of the org-wide rank_promotion_proposals:approve/reject
// permission.
async function toResponseWithCanDecide(
	p: RankPromotionProposal,
	actorUserId: number
): Promise<RankPromotionProposalResp> {
	const canDecide =
		p.status === 'pending' && p.unit !== undefined
			? await rankPromotionProposalController.canDecide(
					p.unit.id,
					actorUserId
				)
			: false
	return { ...toResponse(p), canDecide }
}

function withCanDecide(
	ps: RankPromotionProposal[],
	actorUserId: number
): Promise<RankPromotionProposalResp[]> {
	return Promise.all(ps.map((p) => toResponseWithCanDecide(p, actorUserId)))
}

interface CreateRankPromotionProposalBody {
	unitId: number
	approverUserId: number
	targetRank: string
	note?: string | null
	effectiveDate?: string | null
	troopers: CreateRankPromotionProposalTrooperInput[]
}

interface CreateRankPromotionProposalResponse {
	data: RankPromotionProposalResp
}

export const CreateRankPromotionProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/rank-promotion-proposals'
	},
	async (
		body: CreateRankPromotionProposalBody
	): Promise<CreateRankPromotionProposalResponse> => {
		const actorUserId = requireActorUserId()

		const input: CreateRankPromotionProposalInput = { ...body }
		const created = await rankPromotionProposalController.create(
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

export interface GetRankPromotionProposalsQuery {
	status?: RankPromotionProposalStatus
}

interface GetRankPromotionProposalsResponse {
	data: RankPromotionProposalResp[]
}

export const GetRankPromotionProposals = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/rank-promotion-proposals'
	},
	async (
		q: GetRankPromotionProposalsQuery
	): Promise<GetRankPromotionProposalsResponse> => {
		const actorUserId = requireActorUserId()
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await rankPromotionProposalController.find({
			unitIds: validUnitIds,
			status: q.status
		})

		return { data: await withCanDecide(data, actorUserId) }
	}
)

interface GetRankPromotionProposalEligibleApproversQuery {
	unitId: Query<number>
}

interface GetRankPromotionProposalEligibleApproversResponse {
	data: UserSummary[]
}

// Users eligible to approve a proposal raised from the given unit —
// commanders/deputy commanders/political commanders/deputy political
// commanders of the unit itself or any of its ancestors. Used to populate
// the approver picker with only valid choices.
export const GetRankPromotionProposalEligibleApprovers = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/rank-promotion-proposals/eligible-approvers'
	},
	async (
		q: GetRankPromotionProposalEligibleApproversQuery
	): Promise<GetRankPromotionProposalEligibleApproversResponse> => {
		const users =
			await rankPromotionProposalController.listEligibleApprovers(
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

interface GetRankPromotionProposalParams {
	id: number
}

interface GetRankPromotionProposalResponse {
	data: RankPromotionProposalResp
}

export const GetRankPromotionProposal = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/rank-promotion-proposals/:id'
	},
	async ({
		id
	}: GetRankPromotionProposalParams): Promise<GetRankPromotionProposalResponse> => {
		const actorUserId = requireActorUserId()
		const data = await rankPromotionProposalController.findOne(id)
		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)

interface ApproveRankPromotionProposalParams {
	id: number
}

interface ApproveRankPromotionProposalResponse {
	data: RankPromotionProposalResp
}

export const ApproveRankPromotionProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/rank-promotion-proposals/:id/approve'
	},
	async ({
		id
	}: ApproveRankPromotionProposalParams): Promise<ApproveRankPromotionProposalResponse> => {
		const actorUserId = requireActorUserId()
		const before = await rankPromotionProposalController.findOne(id)

		const data = await rankPromotionProposalController.approve(
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
// GET /students/cron - no `auth: true`. Applies due promotions
// (effectiveDate reached) for already-approved troopers. Unlike
// activity-status-proposals there is no revert sweep — a promotion is
// permanent.
export const RankPromotionProposalCron = api(
	{ expose: false, method: 'GET', path: '/rank-promotion-proposals/cron' },
	async (): Promise<{ ok: true }> => {
		log.info('RankPromotionProposalCron triggered')
		await rankPromotionProposalController.runScheduledTransitions()
		log.info('RankPromotionProposalCron complete')
		return { ok: true }
	}
)

interface RejectRankPromotionProposalRequest {
	id: number
	reason: string
}

interface RejectRankPromotionProposalResponse {
	data: RankPromotionProposalResp
}

export const RejectRankPromotionProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/rank-promotion-proposals/:id/reject'
	},
	async ({
		id,
		reason
	}: RejectRankPromotionProposalRequest): Promise<RejectRankPromotionProposalResponse> => {
		const actorUserId = requireActorUserId()
		if (!reason || reason.trim().length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('A rejection reason is required')
			)
		}
		const before = await rankPromotionProposalController.findOne(id)

		const data = await rankPromotionProposalController.reject(
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

interface CancelRankPromotionProposalParams {
	id: number
}

interface CancelRankPromotionProposalResponse {
	data: RankPromotionProposalResp
}

export const CancelRankPromotionProposal = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/rank-promotion-proposals/:id/cancel'
	},
	async ({
		id
	}: CancelRankPromotionProposalParams): Promise<CancelRankPromotionProposalResponse> => {
		const actorUserId = requireActorUserId()
		const before = await rankPromotionProposalController.findOne(id)

		const data = await rankPromotionProposalController.cancel(
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
