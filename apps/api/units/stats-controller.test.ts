import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanupTestDbs } from '../test-utils/test-db'
import studentRepo from '../students/repo'
import unitStatsController from './stats-controller'
import unitRepo from './repo'

// Real repos over a real database; assertions are on outcomes only.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

async function rejection(promise: Promise<unknown>): Promise<unknown> {
	try {
		await promise
	} catch (err) {
		return err
	}
	throw new Error('expected the promise to reject')
}

async function expectApiError(promise: Promise<unknown>, code: ErrCode) {
	const err = await rejection(promise)

	expect(err).toBeInstanceOf(APIError)
	expect((err as APIError).code).toBe(code)
}

const ids: Record<string, number> = {}
const allUnitIds = () => Object.values(ids)

async function seedUnit(
	key: string,
	alias: string,
	name: string,
	level: 'battalion' | 'company' | 'platoon',
	parentKey?: string
) {
	const [created] = await unitRepo.create([
		{
			alias,
			name,
			level,
			parentId: parentKey ? ids[parentKey] : undefined
		}
	])
	ids[key] = created.id
}

const seedStudent = (fullName: string, unitKey: string) =>
	studentRepo.create([
		{
			fullName,
			rank: 'Binh nhat',
			politicalOrg: 'hcyu',
			unitId: ids[unitKey]
		}
	])

// d1 > c1 > (bch, p1) and c2 > (bch, p1): "bch"/"p1" repeat under each company.
beforeAll(async () => {
	await seedUnit('d1', 'd1', 'Tieu doan 1', 'battalion')
	await seedUnit('c1', 'c1', 'Dai doi 1', 'company', 'd1')
	await seedUnit('c2', 'c2', 'Dai doi 2', 'company', 'd1')
	for (const c of ['c1', 'c2']) {
		await seedUnit(`${c}bch`, 'bch', `Ban chi huy ${c}`, 'platoon', c)
		await seedUnit(`${c}p1`, 'p1', `Trung doi 1 ${c}`, 'platoon', c)
	}

	await seedStudent('Alpha', 'c1bch')
	await seedStudent('Bravo', 'c1bch')
	await seedStudent('Charlie', 'c1p1')
	await seedStudent('Delta', 'c2bch')
})

describe('unitStatsController.getStats', () => {
	it('reports the requested unit', async () => {
		const stats = await unitStatsController.getStats(ids.c1, allUnitIds())

		expect(stats.unit.id).toBe(ids.c1)
		expect(stats.unit.name).toBe('Dai doi 1')
	})

	it('counts students across the unit and its descendants', async () => {
		expect(
			(await unitStatsController.getStats(ids.c1, allUnitIds()))
				.totalStudents
		).toBe(3)
		expect(
			(await unitStatsController.getStats(ids.d1, allUnitIds()))
				.totalStudents
		).toBe(4)
	})

	it('measures each same-alias platoon on its own', async () => {
		const first = await unitStatsController.getStats(
			ids.c1bch,
			allUnitIds()
		)
		const second = await unitStatsController.getStats(
			ids.c2bch,
			allUnitIds()
		)

		expect(first.unit.id).toBe(ids.c1bch)
		expect(first.totalStudents).toBe(2)
		expect(second.unit.id).toBe(ids.c2bch)
		expect(second.totalStudents).toBe(1)
	})

	it('counts sub-units by level, excluding the unit itself', async () => {
		const stats = await unitStatsController.getStats(ids.d1, allUnitIds())

		expect(stats.unitCounts.company).toBe(2)
		expect(stats.unitCounts.platoon).toBe(4)
		expect(stats.unitCounts.battalion).toBeUndefined()
	})

	it('returns zeroed counts for a unit without anything under it', async () => {
		await seedUnit('empty', 'e1', 'Empty platoon', 'platoon', 'c2')

		const stats = await unitStatsController.getStats(
			ids.empty,
			allUnitIds()
		)

		expect(stats.totalStudents).toBe(0)
		expect(stats.unitCounts).toEqual({})
	})

	it('reports an unknown unit as invalid_argument', async () => {
		await expectApiError(
			unitStatsController.getStats(999999, allUnitIds()),
			ErrCode.InvalidArgument
		)
	})

	it('refuses a unit outside the callers scope', async () => {
		await expectApiError(
			unitStatsController.getStats(ids.c2, [ids.c1, ids.c1bch, ids.c1p1]),
			ErrCode.PermissionDenied
		)
	})

	it('refuses everything when the caller has no valid units', async () => {
		await expectApiError(
			unitStatsController.getStats(ids.c1, []),
			ErrCode.PermissionDenied
		)
	})
})

describe('unitStatsController.getStudents', () => {
	const names = (students: { fullName: string | null }[]) =>
		students.map((s) => s.fullName).sort()

	it('lists the students of the unit and its descendants', async () => {
		expect(
			names(await unitStatsController.getStudents(ids.c1, allUnitIds()))
		).toEqual(['Alpha', 'Bravo', 'Charlie'])
	})

	it('lists only the addressed same-alias platoon', async () => {
		expect(
			names(
				await unitStatsController.getStudents(ids.c2bch, allUnitIds())
			)
		).toEqual(['Delta'])
	})

	it('is empty for a unit without students', async () => {
		expect(
			await unitStatsController.getStudents(ids.empty, allUnitIds())
		).toEqual([])
	})

	it('reports an unknown unit as invalid_argument', async () => {
		await expectApiError(
			unitStatsController.getStudents(999999, allUnitIds()),
			ErrCode.InvalidArgument
		)
	})

	it('refuses a unit outside the callers scope', async () => {
		await expectApiError(
			unitStatsController.getStudents(ids.c1, [ids.c2]),
			ErrCode.PermissionDenied
		)
	})
})

describe('unitStatsController material listings', () => {
	it('return an empty list for a unit without materials', async () => {
		expect(
			await unitStatsController.getMaterialStocks(ids.c1, allUnitIds())
		).toEqual([])
		expect(
			await unitStatsController.getMaterialAssets(ids.c1, allUnitIds())
		).toEqual([])
	})

	it('report an unknown unit as invalid_argument', async () => {
		await expectApiError(
			unitStatsController.getMaterialStocks(999999, allUnitIds()),
			ErrCode.InvalidArgument
		)
		await expectApiError(
			unitStatsController.getMaterialAssets(999999, allUnitIds()),
			ErrCode.InvalidArgument
		)
	})

	it('refuse a unit outside the callers scope', async () => {
		await expectApiError(
			unitStatsController.getMaterialStocks(ids.c1, [ids.c2]),
			ErrCode.PermissionDenied
		)
		await expectApiError(
			unitStatsController.getMaterialAssets(ids.c1, [ids.c2]),
			ErrCode.PermissionDenied
		)
	})
})
