import { api, Query } from 'encore.dev/api'
import { APICallMeta, currentRequest } from 'encore.dev'
import log from 'encore.dev/log'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import { setAuditContext } from '../middleware/audit'
import {
	CreateTransferRequestInput,
	CreateTransferRequestMaterialAssetInput,
	CreateTransferRequestMaterialStockInput,
	CreateTransferRequestTrooperInput,
	TransferRequest,
	TransferRequestStatus
} from '../schema/transfer-requests'
import transferRequestController from './controller'

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

// Encore's static analyzer cannot resolve Drizzle's InferSelectModel-derived
// schema types (e.g. TransferRequest) when they're used directly in an
// api()-exposed signature — it fails app-graph building with cascading
// "type never" errors. The rest of this codebase works around this by
// defining plain, hand-written response types for the API surface (see
// units/units.ts's local UnitDB, users/users.ts's local UserDB, etc.) and
// mapping the schema type onto them at the boundary. Same pattern here.
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

interface RoomSummary {
	id: number
	name: string
}

interface StudentSummary {
	id: number
	fullName: string | null
	unitId: number | null
}

interface MaterialAssetSummary {
	id: number
	serialNumber: string
	materialTypeId: number
	unitId: number
	roomId: number | null
	condition: string | null
	status: string
}

interface MaterialTypeSummary {
	id: number
	name: string
	unitOfMeasure: string | null
}

interface TransferRequestTrooperItemResp {
	id: number
	itemStatus: string
	failureReason: string | null
	student?: StudentSummary
}

interface TransferRequestMaterialAssetItemResp {
	id: number
	itemStatus: string
	failureReason: string | null
	materialAsset?: MaterialAssetSummary
}

interface TransferRequestMaterialStockItemResp {
	id: number
	condition: string
	quantity: number
	itemStatus: string
	failureReason: string | null
	materialType?: MaterialTypeSummary
}

interface TransferRequestResp {
	id: number
	status: string
	rejectionReason: string | null
	decidedAt: string | null
	createdAt: string
	updatedAt: string
	sourceUnit?: UnitSummary
	destinationUnit?: UnitSummary
	destinationRoom?: RoomSummary | null
	requestedBy?: UserSummary
	approver?: UserSummary
	decidedBy?: UserSummary | null
	troopers?: TransferRequestTrooperItemResp[]
	materialAssetItems?: TransferRequestMaterialAssetItemResp[]
	materialStockItems?: TransferRequestMaterialStockItemResp[]
	canDecide: boolean
}

function toResponse(
	tr: TransferRequest
): Omit<TransferRequestResp, 'canDecide'> {
	return { ...tr } as unknown as Omit<TransferRequestResp, 'canDecide'>
}

// Whether the given actor currently holds one of the 4 leadership roles on
// a unit that is ancestor-or-self of both the request's source and
// destination units — i.e. whether the approve/reject buttons should show
// for this specific request, independent of the org-wide
// transfer_requests:approve/reject permission.
async function toResponseWithCanDecide(
	tr: TransferRequest,
	actorUserId: number
): Promise<TransferRequestResp> {
	const canDecide =
		tr.status === 'pending' &&
		tr.sourceUnit !== undefined &&
		tr.destinationUnit !== undefined
			? await transferRequestController.canDecide(
					tr.sourceUnit.id,
					tr.destinationUnit.id,
					actorUserId
				)
			: false
	return { ...toResponse(tr), canDecide }
}

function withCanDecide(
	trs: TransferRequest[],
	actorUserId: number
): Promise<TransferRequestResp[]> {
	return Promise.all(
		trs.map((tr) => toResponseWithCanDecide(tr, actorUserId))
	)
}

interface CreateTransferRequestBody {
	sourceUnitId: number
	destinationUnitId: number
	destinationRoomId?: number | null
	approverUserId: number
	troopers?: CreateTransferRequestTrooperInput[]
	materialAssets?: CreateTransferRequestMaterialAssetInput[]
	materialStocks?: CreateTransferRequestMaterialStockInput[]
}

interface CreateTransferRequestResponse {
	data: TransferRequestResp
}

export const CreateTransferRequest = api(
	{ auth: true, expose: true, method: 'POST', path: '/transfer-requests' },
	async (
		body: CreateTransferRequestBody
	): Promise<CreateTransferRequestResponse> => {
		const actorUserId = requireActorUserId()
		log.trace('transferRequests.CreateTransferRequest body', {
			body,
			actorUserId
		})

		const input: CreateTransferRequestInput = { ...body }
		const created = await transferRequestController.create(
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

export interface GetTransferRequestsQuery {
	status?: TransferRequestStatus
}

interface GetTransferRequestsResponse {
	data: TransferRequestResp[]
}

export const GetTransferRequests = api(
	{ auth: true, expose: true, method: 'GET', path: '/transfer-requests' },
	async (
		q: GetTransferRequestsQuery
	): Promise<GetTransferRequestsResponse> => {
		const actorUserId = requireActorUserId()
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await transferRequestController.find({
			unitIds: validUnitIds,
			status: q.status
		})

		return { data: await withCanDecide(data, actorUserId) }
	}
)

interface GetTransferDestinationUnitsResponse {
	data: UnitSummary[]
}

// Candidate destination units for a transfer request: all Company-level-or-
// larger units org-wide, independent of the requester's own validUnitIds
// scope. A transfer's destination unit need not belong to the requester's
// own command chain.
export const GetTransferDestinationUnits = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/transfer-requests/destination-units'
	},
	async (): Promise<GetTransferDestinationUnitsResponse> => {
		const units =
			await transferRequestController.listDestinationCandidateUnits()
		return {
			data: units.map((u) => ({
				id: u.id,
				alias: u.alias,
				name: u.name,
				level: u.level
			}))
		}
	}
)

interface GetTransferEligibleApproversQuery {
	sourceUnitId: Query<number>
	destinationUnitId: Query<number>
}

interface GetTransferEligibleApproversResponse {
	data: UserSummary[]
}

// Users eligible to approve a transfer between the given source and
// destination units — commanders/deputy commanders/political commanders/
// deputy political commanders of any unit that is an ancestor-or-self of
// both. Used to populate the approver picker with only valid choices.
export const GetTransferEligibleApprovers = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/transfer-requests/eligible-approvers'
	},
	async (
		q: GetTransferEligibleApproversQuery
	): Promise<GetTransferEligibleApproversResponse> => {
		const users = await transferRequestController.listEligibleApprovers(
			q.sourceUnitId,
			q.destinationUnitId
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

interface GetTransferRequestParams {
	id: number
}

interface GetTransferRequestResponse {
	data: TransferRequestResp
}

export const GetTransferRequest = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/transfer-requests/:id'
	},
	async ({
		id
	}: GetTransferRequestParams): Promise<GetTransferRequestResponse> => {
		const actorUserId = requireActorUserId()
		const data = await transferRequestController.findOne(id)
		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)

interface ApproveTransferRequestParams {
	id: number
}

interface ApproveTransferRequestResponse {
	data: TransferRequestResp
}

export const ApproveTransferRequest = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/transfer-requests/:id/approve'
	},
	async ({
		id
	}: ApproveTransferRequestParams): Promise<ApproveTransferRequestResponse> => {
		const actorUserId = requireActorUserId()
		const before = await transferRequestController.findOne(id)

		const data = await transferRequestController.approve(id, actorUserId)

		setAuditContext({
			resourceIds: [id],
			previousValue: before,
			newValue: data
		})

		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)

interface RejectTransferRequestRequest {
	id: number
	reason: string
}

interface RejectTransferRequestResponse {
	data: TransferRequestResp
}

export const RejectTransferRequest = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/transfer-requests/:id/reject'
	},
	async ({
		id,
		reason
	}: RejectTransferRequestRequest): Promise<RejectTransferRequestResponse> => {
		const actorUserId = requireActorUserId()
		if (!reason || reason.trim().length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('A rejection reason is required')
			)
		}
		const before = await transferRequestController.findOne(id)

		const data = await transferRequestController.reject(
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

interface CancelTransferRequestParams {
	id: number
}

interface CancelTransferRequestResponse {
	data: TransferRequestResp
}

export const CancelTransferRequest = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/transfer-requests/:id/cancel'
	},
	async ({
		id
	}: CancelTransferRequestParams): Promise<CancelTransferRequestResponse> => {
		const actorUserId = requireActorUserId()
		const before = await transferRequestController.findOne(id)

		const data = await transferRequestController.cancel(id, actorUserId)

		setAuditContext({
			resourceIds: [id],
			previousValue: before,
			newValue: data
		})

		return { data: await toResponseWithCanDecide(data, actorUserId) }
	}
)
