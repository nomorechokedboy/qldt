import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import orm from '../database'
import {
	activityStatusProposalTroopers,
	activityStatusProposals
} from '../schema/activity-status-proposals'
import { materialAssetEvents } from '../schema/material-asset-events'
import { materialAssets } from '../schema/material-assets'
import { materialTypes } from '../schema/material-types'
import { rankPromotionProposalTroopers } from '../schema/rank-promotion-proposals'
import { rankPromotionProposals } from '../schema/rank-promotion-proposals'
import { students } from '../schema/student'
import {
	transferRequestMaterialStocks,
	transferRequestTroopers,
	transferRequests
} from '../schema/transfer-requests'
import { units } from '../schema/units'
import { users } from '../schema/users'
import { cleanupTestDbs } from '../test-utils/test-db'
import unitStatsController from './stats-controller'

// Real controller and repo over a real database; assertions are on outcomes.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

const ids: Record<string, number> = {}
const scope = () => Object.values(ids).filter((v) => v > 0)

// d1 > c1 > p1, d1 > c2; other is a separate battalion.
async function unit(
	key: string,
	level: 'battalion' | 'company' | 'platoon',
	parent?: string
) {
	const [row] = await orm
		.insert(units)
		.values({
			alias: key,
			name: `Unit ${key}`,
			level,
			parentId: parent ? ids[parent] : undefined
		})
		.returning()
	ids[key] = row.id
}

async function weaponType(name: string, category: 'weapon' | 'equipment') {
	const [row] = await orm
		.insert(materialTypes)
		.values({ name, category, isSerialized: true })
		.returning()
	return row.id
}

async function asset(
	serial: string,
	typeId: number,
	unitKey: string,
	extra: { status?: 'in_service' | 'damaged' | 'lost'; trooper?: number } = {}
) {
	const [row] = await orm
		.insert(materialAssets)
		.values({
			serialNumber: serial,
			materialTypeId: typeId,
			unitId: ids[unitKey],
			status: extra.status ?? 'in_service',
			assignedTrooperId: extra.trooper
		})
		.returning()
	return row.id
}

const event = (
	assetId: number,
	eventType: 'assigned' | 'unassigned' | 'transferred' | 'status_changed',
	createdAt: string,
	newValue: Record<string, unknown> = {}
) =>
	orm
		.insert(materialAssetEvents)
		.values({ assetId, eventType, createdAt, newValue })

let userId = 0
const trooper = async (unitKey: string, createdAt: string, cpv?: string) => {
	const [row] = await orm
		.insert(students)
		.values({
			fullName: `Trooper ${unitKey}`,
			rank: 'Binh nhat',
			politicalOrg: 'hcyu',
			unitId: ids[unitKey],
			createdAt,
			cpvOfficialAt: cpv
		})
		.returning()
	return row.id
}

async function transfer(
	source: string,
	destination: string,
	decidedAt: string,
	items: { trooperId?: number; stock?: { typeId: number; quantity: number } }
) {
	const [row] = await orm
		.insert(transferRequests)
		.values({
			sourceUnitId: ids[source],
			destinationUnitId: ids[destination],
			requestedByUserId: userId,
			approverUserId: userId,
			decidedAt,
			status: 'approved'
		})
		.returning()
	if (items.trooperId !== undefined) {
		await orm.insert(transferRequestTroopers).values({
			transferRequestId: row.id,
			studentId: items.trooperId,
			itemStatus: 'approved'
		})
	}
	if (items.stock !== undefined) {
		await orm.insert(transferRequestMaterialStocks).values({
			transferRequestId: row.id,
			materialTypeId: items.stock.typeId,
			condition: 'good',
			quantity: items.stock.quantity,
			itemStatus: 'approved'
		})
	}
}

const FROM = '2026-03-01'
const TO = '2026-03-31'

let ak: number
let radio: number

beforeAll(async () => {
	await unit('d1', 'battalion')
	await unit('c1', 'company', 'd1')
	await unit('p1', 'platoon', 'c1')
	await unit('c2', 'company', 'd1')
	await unit('other', 'battalion')

	const [user] = await orm
		.insert(users)
		.values({ username: 'u', password: 'x' })
		.returning()
	userId = user.id

	ak = await weaponType('AK', 'weapon')
	radio = await weaponType('Radio', 'equipment')

	// Weapons: 3 AK in c1 (one damaged, one assigned), 1 AK in p1, 1 AK in
	// c2, 1 radio (not a weapon), 1 AK elsewhere.
	const shooter = await trooper('c1', '2025-01-10')
	const a1 = await asset('AK-1', ak, 'c1', { trooper: shooter })
	const a2 = await asset('AK-2', ak, 'c1', { status: 'damaged' })
	await asset('AK-3', ak, 'c1')
	await asset('AK-4', ak, 'p1')
	await asset('AK-5', ak, 'c2', { status: 'lost' })
	await asset('R-1', radio, 'c1')
	const outsider = await asset('AK-9', ak, 'other')

	// Events: two in the period, one before, one after, one non-weapon, one
	// on an asset outside the scope.
	await event(a1, 'assigned', '2026-03-05 08:00:00')
	await event(a2, 'status_changed', '2026-03-20T10:00:00.000Z', {
		status: 'damaged'
	})
	await event(a2, 'transferred', '2026-02-28 23:59:59')
	await event(a2, 'status_changed', '2026-04-01 00:00:00', {
		status: 'lost'
	})
	await event(outsider, 'assigned', '2026-03-10 08:00:00')
})

describe('getStats weapon summary', () => {
	it('lists the weapons by type with status and allocation', async () => {
		const { weaponSummary } = await unitStatsController.getStats(
			ids.d1,
			scope()
		)

		expect(weaponSummary.byType).toEqual([
			{
				materialTypeId: ak,
				materialTypeName: 'AK',
				total: 5,
				inService: 3,
				damaged: 1,
				lost: 1,
				retired: 0,
				assigned: 1,
				heldByUnit: 4
			}
		])
	})

	it('shows which sub-unit holds them, rolling platoons up to their company', async () => {
		const { weaponSummary } = await unitStatsController.getStats(
			ids.d1,
			scope()
		)

		expect(
			weaponSummary.byUnit.map((h) => [h.unitId, h.total, h.inService])
		).toEqual([
			[ids.c1, 4, 3],
			[ids.c2, 1, 0]
		])
	})

	it('reports weapons the unit holds itself under the unit', async () => {
		const { weaponSummary } = await unitStatsController.getStats(
			ids.c1,
			scope()
		)

		expect(
			weaponSummary.byUnit.map((h) => [
				h.unitId,
				h.total,
				h.assigned,
				h.heldByUnit
			])
		).toEqual([
			[ids.c1, 3, 1, 2],
			[ids.p1, 1, 0, 1]
		])
	})

	it('accounts for every piece as either with a trooper or held by the unit', async () => {
		const { weaponSummary } = await unitStatsController.getStats(
			ids.d1,
			scope()
		)

		for (const row of [...weaponSummary.byType, ...weaponSummary.byUnit]) {
			expect(row.assigned + row.heldByUnit).toBe(row.total)
		}
	})
})

describe('getPeriodStats', () => {
	it('counts weapon events inside the period only, for weapons in scope', async () => {
		const stats = await unitStatsController.getPeriodStats(
			ids.d1,
			FROM,
			TO,
			scope()
		)

		expect(stats.weaponActivity).toEqual({
			assigned: 1,
			unassigned: 0,
			transferred: 0,
			damaged: 1,
			lost: 0,
			retired: 0
		})
	})

	it('includes the whole last day of the period', async () => {
		const stats = await unitStatsController.getPeriodStats(
			ids.d1,
			'2026-02-28',
			'2026-02-28',
			scope()
		)

		expect(stats.weaponActivity.transferred).toBe(1)
	})

	it('counts troopers who joined and were admitted to the party in the period', async () => {
		await trooper('c1', '2026-03-12 09:00:00', '2026-03-15')
		await trooper('p1', '2026-03-31 23:00:00')
		await trooper('c2', '2026-04-02 09:00:00', '2026-04-02')

		const stats = await unitStatsController.getPeriodStats(
			ids.d1,
			FROM,
			TO,
			scope()
		)

		expect(stats.troopMovement.joined).toBe(2)
		expect(stats.troopMovement.cpvAdmitted).toBe(1)
	})

	it('counts promotions applied in the period', async () => {
		const [proposal] = await orm
			.insert(rankPromotionProposals)
			.values({
				unitId: ids.c1,
				requestedByUserId: userId,
				approverUserId: userId,
				targetRank: 'Binh nhi',
				status: 'approved'
			})
			.returning()
		const promoted = await trooper('c1', '2025-01-01')
		const later = await trooper('c1', '2025-01-01')
		await orm.insert(rankPromotionProposalTroopers).values([
			{
				proposalId: proposal.id,
				studentId: promoted,
				itemStatus: 'approved',
				appliedAt: '2026-03-18T00:00:00.000Z'
			},
			{
				proposalId: proposal.id,
				studentId: later,
				itemStatus: 'approved',
				appliedAt: '2026-05-01T00:00:00.000Z'
			}
		])

		const stats = await unitStatsController.getPeriodStats(
			ids.d1,
			FROM,
			TO,
			scope()
		)

		expect(stats.troopMovement.promoted).toBe(1)
	})

	it('counts discharges applied in the period, not proposed or later ones', async () => {
		const [proposal] = await orm
			.insert(activityStatusProposals)
			.values({
				unitId: ids.c1,
				requestedByUserId: userId,
				approverUserId: userId,
				targetActivityStatus: 'discharged',
				status: 'approved',
				effectiveDate: '2026-03-20'
			})
			.returning()
		const [leaver, later, failed, otherUnit] = [
			await trooper('c1', '2025-01-01'),
			await trooper('p1', '2025-01-01'),
			await trooper('c1', '2025-01-01'),
			await trooper('other', '2025-01-01')
		]
		await orm.insert(activityStatusProposalTroopers).values([
			{
				proposalId: proposal.id,
				studentId: leaver,
				itemStatus: 'approved',
				appliedAt: '2026-03-20T00:00:00.000Z'
			},
			{
				proposalId: proposal.id,
				studentId: later,
				itemStatus: 'approved',
				appliedAt: '2026-04-01T00:00:00.000Z'
			},
			{
				proposalId: proposal.id,
				studentId: failed,
				itemStatus: 'failed'
			},
			{
				proposalId: proposal.id,
				studentId: otherUnit,
				itemStatus: 'approved',
				appliedAt: '2026-03-20T00:00:00.000Z'
			}
		])
		// A leave is not a discharge, even when applied in the period.
		const [leave] = await orm
			.insert(activityStatusProposals)
			.values({
				unitId: ids.c1,
				requestedByUserId: userId,
				approverUserId: userId,
				targetActivityStatus: 'annual_leave',
				status: 'approved'
			})
			.returning()
		await orm.insert(activityStatusProposalTroopers).values({
			proposalId: leave.id,
			studentId: await trooper('c1', '2025-01-01'),
			itemStatus: 'approved',
			appliedAt: '2026-03-21T00:00:00.000Z'
		})

		const stats = await unitStatsController.getPeriodStats(
			ids.d1,
			FROM,
			TO,
			scope()
		)

		expect(stats.troopMovement.discharged).toBe(1)
	})

	it('counts troopers and stock moving across the unit boundary, not within it', async () => {
		const mover = await trooper('c1', '2025-01-01')
		const arrival = await trooper('c1', '2025-01-01')
		const internal = await trooper('c1', '2025-01-01')
		await transfer('c1', 'other', '2026-03-10 12:00:00', {
			trooperId: mover,
			stock: { typeId: radio, quantity: 4 }
		})
		await transfer('other', 'c2', '2026-03-11 12:00:00', {
			trooperId: arrival,
			stock: { typeId: radio, quantity: 10 }
		})
		await transfer('c1', 'c2', '2026-03-12 12:00:00', {
			trooperId: internal,
			stock: { typeId: radio, quantity: 99 }
		})

		const stats = await unitStatsController.getPeriodStats(
			ids.d1,
			FROM,
			TO,
			scope()
		)

		expect(stats.troopMovement.transferredIn).toBe(1)
		expect(stats.troopMovement.transferredOut).toBe(1)
		expect(stats.supplyMovement).toEqual([
			{
				materialTypeId: radio,
				materialTypeName: 'Radio',
				received: 10,
				sent: 4
			}
		])
	})

	it('measures a sub-unit on its own', async () => {
		const stats = await unitStatsController.getPeriodStats(
			ids.c2,
			FROM,
			TO,
			scope()
		)

		expect(stats.troopMovement.transferredIn).toBe(2)
		expect(stats.troopMovement.transferredOut).toBe(0)
	})

	it('rejects a malformed or reversed range', async () => {
		for (const [from, to] of [
			['03/01/2026', TO],
			[FROM, 'soon'],
			[TO, FROM]
		]) {
			const err = await unitStatsController
				.getPeriodStats(ids.d1, from, to, scope())
				.catch((e) => e)

			expect(err).toBeInstanceOf(APIError)
			expect((err as APIError).code).toBe(ErrCode.InvalidArgument)
		}
	})

	it('refuses a unit outside the callers scope', async () => {
		const err = await unitStatsController
			.getPeriodStats(ids.d1, FROM, TO, [ids.other])
			.catch((e) => e)

		expect((err as APIError).code).toBe(ErrCode.PermissionDenied)
	})
})
