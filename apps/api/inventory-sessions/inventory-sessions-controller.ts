import log from 'encore.dev/log'
import { InventorySessionRepository } from '.'
import { AppError } from '../errors'
import { InventorySessionExpectedAssetParams } from '../schema/inventory-session-inspected-assets'
import { InventorySessionScanParams } from '../schema/inventory-session-scans'
import { InventorySessionDB } from '../schema/inventory-sessions'
import { computeInventorySessionDiff, InventorySessionDiffItem } from './diff'
import inventorySessionRepo from './inventory-sessions-repo'
import {
	buildChallengePayload,
	InventorySessionChallengeAsset,
	InventorySessionChallengePayload,
	InventorySessionResultsPayload,
	verifyResultsPayload
} from './payload'

// Hand-rolled response shape, deliberately not `InventorySessionDB`
// (InferSelectModel<typeof inventorySessions>) - Encore's static analyzer
// cannot resolve a Drizzle-inferred type through to a wire schema when it's
// exposed directly from an API handler (see toResponse() in
// transfer-requests/transfer-requests.ts and materials/material-assets.ts's
// own hand-written MaterialAssetDB for the same pattern elsewhere in this
// codebase).
export interface InventorySessionResp {
	id: number
	roomId: number
	unitId: number
	startedByUserId: number
	status: string
	completedAt: string | null
	createdAt: string
	updatedAt: string
}

function toSessionResp(s: InventorySessionDB): InventorySessionResp {
	return {
		id: s.id,
		roomId: s.roomId,
		unitId: s.unitId,
		startedByUserId: s.startedByUserId,
		status: s.status,
		completedAt: s.completedAt,
		createdAt: s.createdAt,
		updatedAt: s.updatedAt
	}
}

export interface InventorySessionReview {
	session: InventorySessionResp
	diff: InventorySessionDiffItem[]
}

class controller {
	constructor(private readonly repo: InventorySessionRepository) {}

	async createChallenge(params: {
		roomId: number
		startedByUserId: number
		validUnitIds: number[]
	}): Promise<InventorySessionChallengePayload> {
		const assets = await this.repo.getRoomMaterialAssets(params.roomId)
		if (assets.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Room has no serialized material assets to reconcile'
				)
			)
		}

		// material_assets in the same room share a unit; use it both as the
		// session's unit and as the permission check, rather than trusting a
		// caller-supplied unitId.
		const unitId = assets[0].unitId
		if (!params.validUnitIds.includes(unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to start an inventory session for this room"
				)
			)
		}

		const session = await this.repo.create({
			roomId: params.roomId,
			unitId,
			startedByUserId: params.startedByUserId,
			status: 'in_progress'
		})

		const expectedParams: InventorySessionExpectedAssetParams[] =
			assets.map((a) => ({
				sessionId: session.id,
				assetId: a.id,
				serialNumber: a.serialNumber,
				conditionSnapshot: a.condition ?? 'good'
			}))
		await this.repo.snapshotExpectedAssets(expectedParams)

		const expected: InventorySessionChallengeAsset[] = assets.map((a) => ({
			serial: a.serialNumber,
			materialTypeName: a.materialTypeName,
			condition: a.condition ?? 'good'
		}))

		log.info('InventorySessionController.createChallenge', {
			sessionId: session.id,
			roomId: params.roomId,
			assetCount: assets.length
		})

		return buildChallengePayload(session.id, params.roomId, expected)
	}

	async submitResults(
		payload: InventorySessionResultsPayload
	): Promise<InventorySessionReview> {
		if (!verifyResultsPayload(payload)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Results payload signature is invalid - it does not match an open session'
				)
			)
		}

		const session = await this.repo.getOne(payload.sid)
		if (!session) {
			throw AppError.handleAppErr(
				AppError.notFound('Inventory session not found')
			)
		}
		if (session.status !== 'in_progress') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Session is already ${session.status}, results cannot be submitted again`
				)
			)
		}

		const serials = payload.results.map((r) => r.serial)
		const matchedAssets = await this.repo.findAssetsBySerials(serials)
		const assetIdBySerial = new Map(
			matchedAssets.map((a) => [a.serialNumber, a.id])
		)

		// Extras (a serial with no matching material_assets row) get assetId:
		// null and are still recorded - they never block completion, they just
		// surface in the diff for the reviewer to act on.
		const scanParams: InventorySessionScanParams[] = payload.results.map(
			(r) => ({
				sessionId: payload.sid,
				serialNumber: r.serial,
				assetId: assetIdBySerial.get(r.serial) ?? null,
				observedCondition: r.observedCondition ?? null
			})
		)
		await this.repo.insertScans(scanParams)

		const completed = await this.repo.markCompleted(payload.sid)

		log.info('InventorySessionController.submitResults', {
			sessionId: payload.sid,
			scanCount: scanParams.length
		})

		return this.buildReview(completed)
	}

	async getReview(sessionId: number): Promise<InventorySessionReview> {
		const session = await this.repo.getOne(sessionId)
		if (!session) {
			throw AppError.handleAppErr(
				AppError.notFound('Inventory session not found')
			)
		}
		return this.buildReview(session)
	}

	private async buildReview(
		session: InventorySessionDB
	): Promise<InventorySessionReview> {
		const [expected, scans] = await Promise.all([
			this.repo.getExpectedAssets(session.id),
			this.repo.getScans(session.id)
		])
		return {
			session: toSessionResp(session),
			diff: computeInventorySessionDiff(expected, scans)
		}
	}
}

const inventorySessionController = new controller(inventorySessionRepo)

export default inventorySessionController
