import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import orm from '../database'
import { materialAssetEvents } from '../schema/material-asset-events'
import { materialAssets } from '../schema/material-assets'
import { materialTypes } from '../schema/material-types'
import { cleanupTestDbs } from '../test-utils/test-db'
import unitRepo from '../units/repo'
import studentRepo from './repo'

// Real repos over a real database; assertions are on what is left in the
// asset tables after a trooper's activity status changes.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

let unitId: number
let typeId: number

beforeAll(async () => {
	const [unit] = await unitRepo.create([
		{ alias: 'c1', name: 'Dai doi 1', level: 'company' }
	])
	unitId = unit.id
	const [type] = await orm
		.insert(materialTypes)
		.values({ name: 'AK', category: 'weapon', isSerialized: true })
		.returning()
	typeId = type.id
})

async function trooper(fullName: string) {
	const [row] = await studentRepo.create([
		{
			fullName,
			rank: 'Binh nhat',
			position: 'Chien si',
			politicalOrg: 'hcyu',
			unitId
		}
	])
	return row.id
}

async function issue(serialNumber: string, trooperId: number) {
	const [row] = await orm
		.insert(materialAssets)
		.values({
			serialNumber,
			materialTypeId: typeId,
			unitId,
			assignedTrooperId: trooperId
		})
		.returning()
	return row.id
}

const holderOf = async (assetId: number) =>
	(
		await orm
			.select()
			.from(materialAssets)
			.where(eq(materialAssets.id, assetId))
	)[0]

describe('discharging a trooper', () => {
	it('returns everything issued to them to the unit and logs each return', async () => {
		const leaver = await trooper('Leaver')
		const stayer = await trooper('Stayer')
		const rifle = await issue('D-1', leaver)
		const spare = await issue('D-2', leaver)
		const kept = await issue('D-3', stayer)

		await studentRepo.update([
			{ id: leaver, updatePayload: { activityStatus: 'discharged' } }
		])

		expect((await holderOf(rifle)).assignedTrooperId).toBeNull()
		expect((await holderOf(spare)).assignedTrooperId).toBeNull()
		expect((await holderOf(rifle)).unitId).toBe(unitId)
		expect((await holderOf(kept)).assignedTrooperId).toBe(stayer)

		const events = await orm.select().from(materialAssetEvents)
		const returned = events.filter((e) => e.eventType === 'unassigned')
		expect(returned.map((e) => e.assetId).sort()).toEqual(
			[rifle, spare].sort()
		)
		expect(returned[0].previousValue).toEqual({
			assignedTrooperName: 'Leaver'
		})
	})

	it('leaves weapons with a trooper who is only on leave', async () => {
		const onLeave = await trooper('On leave')
		const rifle = await issue('L-1', onLeave)

		await studentRepo.update([
			{ id: onLeave, updatePayload: { activityStatus: 'annual_leave' } }
		])

		expect((await holderOf(rifle)).assignedTrooperId).toBe(onLeave)
	})

	it('is harmless for a trooper who was issued nothing', async () => {
		const empty = await trooper('Empty handed')

		const [updated] = await studentRepo.update([
			{ id: empty, updatePayload: { activityStatus: 'discharged' } }
		])

		expect(updated.activityStatus).toBe('discharged')
	})
})
