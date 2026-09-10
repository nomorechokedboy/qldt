import log from 'encore.dev/log'
import { InventorySessionRepository } from '.'
import { AppError } from '../errors'
import { InventorySessionExpectedAssetParams } from '../schema/inventory-session-inspected-assets'
import { InventorySessionExpectedStockParams } from '../schema/inventory-session-expected-stocks'
import { InventorySessionScanParams } from '../schema/inventory-session-scans'
import { InventorySessionStockCountParams } from '../schema/inventory-session-stock-counts'
import { InventorySessionDB } from '../schema/inventory-sessions'
import { computeInventorySessionDiff, InventorySessionDiffItem } from './diff'
import {
	computeInventorySessionStockDiff,
	InventorySessionStockDiffItem
} from './stock-diff'
import inventorySessionRepo from './inventory-sessions-repo'
import {
	buildChallengePayload,
	InventorySessionChallengeAsset,
	InventorySessionChallengeStock,
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

// A session left `in_progress` this long (phone never came back, PC tab
// closed mid-scan) is treated as abandoned rather than "the" open session -
// otherwise a stale row can outrank the real current one when a room has
// more than one `in_progress` session sitting in the table.
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000

// `createdAt` is stored via SQLite's `CURRENT_TIMESTAMP` default, which
// formats as "YYYY-MM-DD HH:MM:SS" (space-separated, UTC, no milliseconds) -
// not `Date#toISOString()`'s "YYYY-MM-DDTHH:MM:SS.sssZ". Comparing the two
// formats as strings breaks same-day ordering (' ' sorts before 'T'
// regardless of the actual time), so the cutoff must be formatted the same
// way as the column it's compared against.
function toSqliteTimestamp(d: Date): string {
	return d.toISOString().slice(0, 19).replace('T', ' ')
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
	stockDiff: InventorySessionStockDiffItem[]
}

export class InventorySessionController {
	constructor(private readonly repo: InventorySessionRepository) {}

	async createChallenge(params: {
		roomId: number
		startedByUserId: number
		validUnitIds: number[]
	}): Promise<InventorySessionChallengePayload> {
		const [assets, stocks] = await Promise.all([
			this.repo.getRoomMaterialAssets(params.roomId),
			this.repo.getRoomMaterialStocks(params.roomId)
		])
		if (assets.length === 0 && stocks.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Room has no serialized material assets or bulk stock to reconcile'
				)
			)
		}

		// material_assets/material_stocks in the same room share a unit; use
		// it both as the session's unit and as the permission check, rather
		// than trusting a caller-supplied unitId.
		const unitId = assets[0]?.unitId ?? stocks[0]?.unitId
		if (unitId === undefined || !params.validUnitIds.includes(unitId)) {
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
		const expectedStockParams: InventorySessionExpectedStockParams[] =
			stocks.map((s) => ({
				sessionId: session.id,
				materialTypeId: s.materialTypeId,
				condition: s.condition ?? 'good',
				expectedQuantity: s.quantity
			}))
		await Promise.all([
			this.repo.snapshotExpectedAssets(expectedParams),
			this.repo.snapshotExpectedStocks(expectedStockParams)
		])

		const expected: InventorySessionChallengeAsset[] = assets.map((a) => ({
			serial: a.serialNumber,
			materialTypeName: a.materialTypeName,
			condition: a.condition ?? 'good'
		}))
		const expectedStocks: InventorySessionChallengeStock[] = stocks.map(
			(s) => ({
				materialTypeId: s.materialTypeId,
				materialTypeName: s.materialTypeName,
				condition: s.condition ?? 'good',
				expectedQuantity: s.quantity
			})
		)

		log.info('InventorySessionController.createChallenge', {
			sessionId: session.id,
			roomId: params.roomId,
			assetCount: assets.length,
			stockLineCount: stocks.length
		})

		return buildChallengePayload(
			session.id,
			params.roomId,
			expected,
			expectedStocks
		)
	}

	// Rebuilds the challenge payload for a room's still-open session, if any
	// - deterministic from sessionId + the already-snapshotted expected
	// assets/stocks, so it reproduces the exact same QR (same key/sig) the
	// PC originally showed. Lets the PC side resume after a reload/reboot
	// instead of losing track of a session the phone may still be scanning.
	async getOpenChallenge(
		roomId: number,
		validUnitIds: number[]
	): Promise<InventorySessionChallengePayload | null> {
		const cutoff = toSqliteTimestamp(
			new Date(Date.now() - SESSION_EXPIRY_MS)
		)
		await this.repo.expireStaleSessions(roomId, cutoff)

		const session = await this.repo.getOpenSessionForRoom(roomId)
		if (!session) return null

		if (!validUnitIds.includes(session.unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to view this room's inventory session"
				)
			)
		}

		const [expectedAssets, expectedStocks] = await Promise.all([
			this.repo.getExpectedAssetsWithType(session.id),
			this.repo.getExpectedStocksWithType(session.id)
		])
		const expected: InventorySessionChallengeAsset[] = expectedAssets.map(
			(a) => ({
				serial: a.serialNumber,
				materialTypeName: a.materialTypeName,
				condition: a.conditionSnapshot
			})
		)
		const stocks: InventorySessionChallengeStock[] = expectedStocks.map(
			(s) => ({
				materialTypeId: s.materialTypeId,
				materialTypeName: s.materialTypeName,
				condition: s.condition,
				expectedQuantity: s.expectedQuantity
			})
		)

		return buildChallengePayload(session.id, roomId, expected, stocks)
	}

	// Backs the room's "Lịch sử kiểm kê" history sheet - lightweight session
	// summaries only (no diff), so the diff for a given session is only
	// computed on demand via getReview when a reviewer actually opens it.
	async listSessionsForRoom(
		roomId: number,
		validUnitIds: number[]
	): Promise<InventorySessionResp[]> {
		const sessions = await this.repo.listSessionsForRoom(roomId)
		if (sessions.length === 0) return []

		// A room's unit can't realistically change between sessions in this
		// product - same check as createChallenge/getOpenChallenge, applied
		// once for the whole list rather than per session.
		if (!validUnitIds.includes(sessions[0].unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to view this room's inventory session history"
				)
			)
		}

		return sessions.map(toSessionResp)
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

		const age =
			Date.now() -
			new Date(`${session.createdAt.replace(' ', 'T')}Z`).getTime()
		if (age > SESSION_EXPIRY_MS) {
			await this.repo.markExpired(session.id)
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Session has expired, please start a new inventory session'
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
		const stockCountParams: InventorySessionStockCountParams[] =
			payload.stockResults.map((r) => ({
				sessionId: payload.sid,
				materialTypeId: r.materialTypeId,
				condition: r.condition,
				observedQuantity: r.observedQuantity
			}))
		await Promise.all([
			this.repo.insertScans(scanParams),
			this.repo.insertStockCounts(stockCountParams)
		])

		const completed = await this.repo.markCompleted(payload.sid)

		log.info('InventorySessionController.submitResults', {
			sessionId: payload.sid,
			scanCount: scanParams.length,
			stockCountLineCount: stockCountParams.length
		})

		return this.buildReview(completed)
	}

	// The final step of the flow: a reviewer looks at the diff (via
	// getReview) and, once satisfied, marks the session reviewed. This is
	// deliberately a separate step from submitResults - completing the scan
	// and reviewing its outcome are different responsibilities (the trooper
	// who imports the results QR isn't necessarily the one who signs off on
	// the diff). Does not touch `material_assets` - reconciling the diff
	// into the asset registry is a manual follow-up action, not automatic.
	async markReviewed(
		sessionId: number,
		validUnitIds: number[]
	): Promise<InventorySessionReview> {
		const session = await this.repo.getOne(sessionId)
		if (!session) {
			throw AppError.handleAppErr(
				AppError.notFound('Inventory session not found')
			)
		}
		if (!validUnitIds.includes(session.unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to review this inventory session"
				)
			)
		}
		if (session.status !== 'completed') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Session must be completed before it can be reviewed (current status: ${session.status})`
				)
			)
		}

		const reviewed = await this.repo.markReviewed(sessionId)

		log.info('InventorySessionController.markReviewed', { sessionId })

		return this.buildReview(reviewed)
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
		const [expected, scans, expectedStocks, stockCounts] =
			await Promise.all([
				this.repo.getExpectedAssets(session.id),
				this.repo.getScans(session.id),
				this.repo.getExpectedStocks(session.id),
				this.repo.getStockCounts(session.id)
			])
		return {
			session: toSessionResp(session),
			diff: computeInventorySessionDiff(expected, scans),
			stockDiff: computeInventorySessionStockDiff(
				expectedStocks,
				stockCounts
			)
		}
	}
}

const inventorySessionController = new InventorySessionController(
	inventorySessionRepo
)

export default inventorySessionController
