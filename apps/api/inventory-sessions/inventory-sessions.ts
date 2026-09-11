import { APICallMeta, currentRequest } from 'encore.dev'
import { api, Query } from 'encore.dev/api'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import { setAuditContext } from '../middleware/audit'
import { InventorySessionStatus } from '../schema/inventory-sessions'
import inventorySessionController, {
	ApplyInventorySessionResult,
	InventorySessionAssetResolution,
	InventorySessionResp,
	InventorySessionReview,
	InventorySessionStockResolution
} from './inventory-sessions-controller'
import {
	InventorySessionChallengePayload,
	InventorySessionResultsPayload
} from './payload'

interface CreateInventorySessionRequest {
	roomId: number
}

// PC side: commander opens a session for a room, gets back the payload to
// render as the challenge QR. See docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md.
export const CreateInventorySession = api(
	{ auth: true, expose: true, method: 'POST', path: '/inventory-sessions' },
	async (
		body: CreateInventorySessionRequest
	): Promise<InventorySessionChallengePayload> => {
		const authData = getAuthData()
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const startedByUserId = authData?.userID
			? Number(authData.userID)
			: undefined
		if (startedByUserId === undefined) {
			throw AppError.handleAppErr(
				AppError.unauthenticated('Authentication required')
			)
		}

		const payload = await inventorySessionController.createChallenge({
			roomId: body.roomId,
			startedByUserId,
			validUnitIds
		})

		setAuditContext({
			resourceIds: [payload.sid],
			newValue: {
				roomId: body.roomId,
				assetCount: payload.expected.length
			}
		})

		return payload
	}
)

// PC side: after the webcam decodes the results QR from the phone, the
// decoded payload is posted here as-is (still signed) - the server
// re-verifies the signature itself rather than trusting the client decode.
export const SubmitInventorySessionResults = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/inventory-sessions/results'
	},
	async (
		body: InventorySessionResultsPayload
	): Promise<InventorySessionReview> => {
		const review = await inventorySessionController.submitResults(body)

		setAuditContext({
			resourceIds: [review.session.id],
			newValue: { status: review.session.status, diff: review.diff }
		})

		return review
	}
)

interface GetOpenInventorySessionParams {
	roomId: number
}

interface GetOpenInventorySessionResponse {
	session: InventorySessionChallengePayload | null
}

// PC side: called when opening a room's inventory dialog to check whether a
// session is already in progress (e.g. the tab was closed or the PC was
// restarted while the phone was still scanning) - lets the UI resume instead
// of starting a duplicate session.
export const GetOpenInventorySession = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/inventory-sessions/room/:roomId/open'
	},
	async ({
		roomId
	}: GetOpenInventorySessionParams): Promise<GetOpenInventorySessionResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const session = await inventorySessionController.getOpenChallenge(
			roomId,
			validUnitIds
		)
		return { session }
	}
)

interface GetInventorySessionsForRoomParams {
	roomId: number
	status?: Query<InventorySessionStatus>
	from?: Query<string>
	to?: Query<string>
	page?: Query<number>
	pageSize?: Query<number>
}

interface GetInventorySessionsForRoomResponse {
	data: InventorySessionResp[]
	total: number
}

// PC side: backs the "Lịch sử kiểm kê" history sheet on a room - filtered
// (status, date range) and paginated, newest first.
export const GetInventorySessionsForRoom = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/inventory-sessions/room/:roomId/history'
	},
	async ({
		roomId,
		status,
		from,
		to,
		page,
		pageSize
	}: GetInventorySessionsForRoomParams): Promise<GetInventorySessionsForRoomResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		return inventorySessionController.listSessionsForRoom(
			roomId,
			validUnitIds,
			{ status, from, to, page, pageSize }
		)
	}
)

interface GetInventorySessionReviewParams {
	id: number
}

export const GetInventorySessionReview = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/inventory-sessions/:id/review'
	},
	async ({
		id
	}: GetInventorySessionReviewParams): Promise<InventorySessionReview> => {
		return inventorySessionController.getReview(id)
	}
)

interface MarkInventorySessionReviewedParams {
	id: number
}

// PC side: a reviewer has looked at the diff (via GetInventorySessionReview)
// and signs off on it. Terminal step of the flow - does not itself change
// `material_assets`; reconciling the diff into the asset registry is a
// separate, manual action.
export const MarkInventorySessionReviewed = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/inventory-sessions/:id/review'
	},
	async ({
		id
	}: MarkInventorySessionReviewedParams): Promise<InventorySessionReview> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const review = await inventorySessionController.markReviewed(
			id,
			validUnitIds
		)

		setAuditContext({
			resourceIds: [id],
			newValue: { status: review.session.status }
		})

		return review
	}
)

interface ApplyInventorySessionResultsParams {
	id: number
	assetResolutions?: InventorySessionAssetResolution[]
	stockResolutions?: InventorySessionStockResolution[]
}

interface ApplyInventorySessionResultsResponse {
	data: ApplyInventorySessionResult
}

// PC side: a separate, explicit step after review - syncs the reviewed diff
// into material_assets/material_stocks (missing -> lost, condition changes
// applied automatically; extra assets/stock lines only for lines the
// reviewer explicitly resolved with action: 'apply'). One-shot per session.
export const ApplyInventorySessionResults = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/inventory-sessions/:id/apply'
	},
	async ({
		id,
		assetResolutions,
		stockResolutions
	}: ApplyInventorySessionResultsParams): Promise<ApplyInventorySessionResultsResponse> => {
		const authData = getAuthData()
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const actorUserId = authData?.userID
			? Number(authData.userID)
			: undefined
		if (actorUserId === undefined) {
			throw AppError.handleAppErr(
				AppError.unauthenticated('Authentication required')
			)
		}

		const result = await inventorySessionController.applyToInventory(
			id,
			validUnitIds,
			actorUserId,
			{ assetResolutions, stockResolutions }
		)

		setAuditContext({
			resourceIds: [id],
			newValue: result
		})

		return { data: result }
	}
)
