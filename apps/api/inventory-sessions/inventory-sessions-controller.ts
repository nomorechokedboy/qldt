import log from 'encore.dev/log'
import { InventorySessionListQuery, InventorySessionRepository } from '.'
import { AppError } from '../errors'
import materialAssetRepo from '../materials/material-assets-repo'
import materialAssetEventRepo from '../materials/material-asset-events-repo'
import materialStockRepo from '../materials/material-stocks-repo'
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
	INVENTORY_SESSION_PAYLOAD_VERSION,
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
	appliedAt: string | null
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
		appliedAt: s.appliedAt,
		createdAt: s.createdAt,
		updatedAt: s.updatedAt
	}
}

export interface InventorySessionReview {
	session: InventorySessionResp
	diff: InventorySessionDiffItem[]
	stockDiff: InventorySessionStockDiffItem[]
}

// A reviewer's explicit per-line decision for an unmatched (extra) asset
// serial or stock line - "apply" reassigns/credits it into the room's
// inventory, "ignore" leaves it flagged in the diff only. Missing and
// condition_changed asset lines are never resolved this way - they always
// auto-apply (see applyToInventory).
export interface InventorySessionAssetResolution {
	serial: string
	action: 'apply' | 'ignore'
}

export interface InventorySessionStockResolution {
	materialTypeId: number
	condition: string
	action: 'apply' | 'ignore'
}

export interface ApplyInventorySessionResult {
	session: InventorySessionResp
	missingApplied: number
	conditionChangedApplied: number
	extraAssetsApplied: number
	extraAssetsFlagged: number
	stockShortOverApplied: number
	stockExtraApplied: number
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
		validUnitIds: number[],
		query: InventorySessionListQuery
	): Promise<{ data: InventorySessionResp[]; total: number }> {
		// Checked via a dedicated lookup, not sessions[0].unitId - a filtered
		// query (status/date range) can legitimately return zero rows for a
		// room that has sessions overall, so the permission check must not
		// depend on the result set being non-empty.
		const unitId = await this.repo.getRoomUnitId(roomId)
		if (unitId === undefined || !validUnitIds.includes(unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to view this room's inventory session history"
				)
			)
		}

		const { data, total } = await this.repo.listSessionsForRoom(
			roomId,
			query
		)
		return { data: data.map(toSessionResp), total }
	}

	async submitResults(
		payload: InventorySessionResultsPayload
	): Promise<InventorySessionReview> {
		// A v1-shaped payload (no `stockResults`, or an old `v`) must be
		// rejected here, before verifyResultsPayload/canonicalResults ever
		// touches `payload.stockResults` - otherwise a v1 payload crashes with
		// a TypeError from `.map()` on `undefined` instead of failing cleanly.
		if (
			payload.v !== INVENTORY_SESSION_PAYLOAD_VERSION ||
			!Array.isArray(payload.stockResults)
		) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Results payload is from an incompatible app version - please update the scanning app and start a new session'
				)
			)
		}
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

	// Syncs a reviewed session's diff into material_assets/material_stocks -
	// a deliberate separate step from markReviewed, so a reviewer can look at
	// the diff before committing it. Missing/condition_changed asset lines
	// always auto-apply (a missing asset is marked lost, a condition change is
	// recorded) since there's nothing for a human to decide there; extra
	// asset serials and short/over/extra stock lines only apply when the
	// caller explicitly resolved that line with action: 'apply' - anything
	// else (unresolved, or an extra serial matching no existing
	// material_assets row) is left flagged in the diff for a human to handle
	// later, never silently written. One-shot: `appliedAt` blocks a second
	// apply on the same session (see `markApplied`).
	async applyToInventory(
		sessionId: number,
		validUnitIds: number[],
		actorUserId: number,
		resolutions: {
			assetResolutions?: InventorySessionAssetResolution[]
			stockResolutions?: InventorySessionStockResolution[]
		}
	): Promise<ApplyInventorySessionResult> {
		const session = await this.repo.getOne(sessionId)
		if (!session) {
			throw AppError.handleAppErr(
				AppError.notFound('Inventory session not found')
			)
		}
		if (!validUnitIds.includes(session.unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to apply this inventory session's results to inventory"
				)
			)
		}
		if (session.status !== 'reviewed') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Session must be reviewed before it can be applied to inventory (current status: ${session.status})`
				)
			)
		}
		if (session.appliedAt !== null) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'This inventory session has already been applied to inventory'
				)
			)
		}

		// Recomputed server-side from the session's own stored scans/counts,
		// never trusted from the client - a stale or tampered client-side diff
		// must not be able to drive what gets written to material_assets/
		// material_stocks.
		const [expected, scans, expectedStocks, stockCounts] =
			await Promise.all([
				this.repo.getExpectedAssets(session.id),
				this.repo.getScans(session.id),
				this.repo.getExpectedStocksWithType(session.id),
				this.repo.getStockCounts(session.id)
			])
		const diff = computeInventorySessionDiff(expected, scans)
		const stockDiff = computeInventorySessionStockDiff(
			expectedStocks,
			stockCounts
		)

		const assetActionBySerial = new Map(
			(resolutions.assetResolutions ?? []).map((r) => [
				r.serial,
				r.action
			])
		)
		const stockActionByKey = new Map(
			(resolutions.stockResolutions ?? []).map((r) => [
				`${r.materialTypeId}:${r.condition}`,
				r.action
			])
		)

		const relevantSerials = diff
			.filter((d) => d.status !== 'matched')
			.map((d) => d.serial)
		const assetsBySerial = new Map(
			(await this.repo.findAssetsBySerials(relevantSerials)).map((a) => [
				a.serialNumber,
				a
			])
		)

		let missingApplied = 0
		let conditionChangedApplied = 0
		let extraAssetsApplied = 0
		let extraAssetsFlagged = 0

		for (const item of diff) {
			if (item.status === 'missing') {
				const asset = assetsBySerial.get(item.serial)
				if (!asset) continue
				await materialAssetRepo.update([
					{ id: asset.id, updatePayload: { status: 'lost' } }
				])
				await materialAssetEventRepo.create([
					{
						assetId: asset.id,
						eventType: 'status_changed',
						previousValue: { status: asset.status },
						newValue: { status: 'lost' },
						actorUserId
					}
				])
				missingApplied++
			} else if (item.status === 'condition_changed') {
				const asset = assetsBySerial.get(item.serial)
				if (!asset || !item.observedCondition) continue
				await materialAssetRepo.update([
					{
						id: asset.id,
						updatePayload: { condition: item.observedCondition }
					}
				])
				await materialAssetEventRepo.create([
					{
						assetId: asset.id,
						eventType: 'condition_changed',
						previousValue: { condition: asset.condition },
						newValue: { condition: item.observedCondition },
						actorUserId
					}
				])
				conditionChangedApplied++
			} else if (item.status === 'extra') {
				if (assetActionBySerial.get(item.serial) !== 'apply') continue
				const asset = assetsBySerial.get(item.serial)
				if (!asset) {
					// A serial with no matching material_assets row can never be
					// applied, regardless of what the client requested - there is
					// nothing to reassign, so it stays flagged for a human.
					extraAssetsFlagged++
					continue
				}
				const previousRoomId = asset.roomId
				const previousUnitId = asset.unitId
				await materialAssetRepo.update([
					{
						id: asset.id,
						updatePayload: {
							roomId: session.roomId,
							unitId: session.unitId,
							condition: item.observedCondition ?? asset.condition
						}
					}
				])
				await materialAssetEventRepo.create([
					{
						assetId: asset.id,
						eventType: 'transferred',
						previousValue: {
							roomId: previousRoomId,
							unitId: previousUnitId
						},
						newValue: {
							roomId: session.roomId,
							unitId: session.unitId
						},
						actorUserId
					}
				])
				extraAssetsApplied++
			}
		}

		let stockShortOverApplied = 0
		let stockExtraApplied = 0

		for (const item of stockDiff) {
			if (item.status === 'matched') continue
			const key = `${item.materialTypeId}:${item.condition}`
			if (stockActionByKey.get(key) !== 'apply') continue

			if (item.status === 'short' || item.status === 'over') {
				const existing = await materialStockRepo.getOne({
					materialTypeId: item.materialTypeId,
					unitId: session.unitId,
					roomId: session.roomId,
					condition: item.condition
				})
				if (!existing) continue
				await materialStockRepo.update([
					{
						id: existing.id,
						updatePayload: { quantity: item.observedQuantity }
					}
				])
				stockShortOverApplied++
			} else if (item.status === 'extra') {
				await materialStockRepo.create([
					{
						materialTypeId: item.materialTypeId,
						unitId: session.unitId,
						roomId: session.roomId,
						condition: item.condition,
						quantity: item.observedQuantity
					}
				])
				stockExtraApplied++
			}
		}

		const applied = await this.repo.markApplied(sessionId)

		log.info('InventorySessionController.applyToInventory', {
			sessionId,
			missingApplied,
			conditionChangedApplied,
			extraAssetsApplied,
			extraAssetsFlagged,
			stockShortOverApplied,
			stockExtraApplied
		})

		return {
			session: toSessionResp(applied),
			missingApplied,
			conditionChangedApplied,
			extraAssetsApplied,
			extraAssetsFlagged,
			stockShortOverApplied,
			stockExtraApplied
		}
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
				this.repo.getExpectedStocksWithType(session.id),
				this.repo.getStockCounts(session.id)
			])
		const stockDiff = computeInventorySessionStockDiff(
			expectedStocks,
			stockCounts
		)

		// `extra` lines (a materialTypeId/condition combo counted by the
		// trooper but absent from expectedStocks) have no join available in
		// computeInventorySessionStockDiff, so their name is resolved here
		// against the current material_types table instead.
		const extraTypeIds = [
			...new Set(
				stockDiff
					.filter((s) => s.status === 'extra')
					.map((s) => s.materialTypeId)
			)
		]
		if (extraTypeIds.length > 0) {
			const namesById =
				await this.repo.getMaterialTypeNamesByIds(extraTypeIds)
			for (const item of stockDiff) {
				if (item.status === 'extra') {
					item.materialTypeName = namesById.get(item.materialTypeId)
				}
			}
		}

		return {
			session: toSessionResp(session),
			diff: computeInventorySessionDiff(expected, scans),
			stockDiff
		}
	}
}

const inventorySessionController = new InventorySessionController(
	inventorySessionRepo
)

export default inventorySessionController
