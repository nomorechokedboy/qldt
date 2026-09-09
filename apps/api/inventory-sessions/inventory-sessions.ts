import { APICallMeta, currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import inventorySessionController, {
	InventorySessionReview
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

		return inventorySessionController.createChallenge({
			roomId: body.roomId,
			startedByUserId,
			validUnitIds
		})
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
		return inventorySessionController.submitResults(body)
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
