import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import roomRepo from '../facilities/rooms-repo'
import studentRepo from '../students/repo'
import unitRepo from '../units/repo'
import unitStatsRepo from '../units/stats-repo'
import materialAssetController from './material-assets-controller'
import materialAssetRepo from './material-assets-repo'
import materialStockController from './material-stocks-controller'
import materialStockRepo from './material-stocks-repo'
import materialTypeRepo from './material-types-repo'
import { cleanupTestDbs } from '../test-utils/test-db'

// Bulk import goes through the create paths, so these tests act as the leader
// of company 1 and try to write rows that reach company 2. Everything runs on
// a real database and asserts only on what ends up stored and on the error
// the caller sees.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

async function expectApiError(promise: Promise<unknown>, code: ErrCode) {
	let err: unknown
	try {
		await promise
	} catch (e) {
		err = e
	}

	expect(err).toBeInstanceOf(APIError)
	expect((err as APIError).code).toBe(code)
}

const ids: Record<string, number> = {}
let c1Scope: number[]
let serializedTypeId: number
let stockTypeId: number

// d1 (battalion)
// |- c1 (company) - c1p1 (platoon)
// `- c2 (company) - c2p1 (platoon)
async function seedUnit(
	key: string,
	level: 'battalion' | 'company' | 'platoon',
	parentKey?: string
) {
	const [created] = await unitRepo.create([
		{
			alias: key,
			name: key,
			level,
			parentId: parentKey ? ids[parentKey] : undefined
		}
	])
	ids[key] = created.id
}

async function seedRoom(key: string, unitKey: string) {
	const [room] = await roomRepo.create([{ name: key, unitId: ids[unitKey] }])
	ids[key] = room.id
}

async function seedTrooper(key: string, unitKey: string) {
	const [student] = await studentRepo.create([
		{
			fullName: key,
			rank: 'Binh nhat',
			position: 'Chien si',
			politicalOrg: 'hcyu',
			unitId: ids[unitKey]
		}
	])
	ids[key] = student.id
}

let serial = 0
const asset = (unitKey: string, extra: Record<string, unknown> = {}) => ({
	materialTypeId: serializedTypeId,
	unitId: ids[unitKey],
	serialNumber: `SN-${++serial}`,
	...extra
})

beforeAll(async () => {
	await seedUnit('d1', 'battalion')
	await seedUnit('c1', 'company', 'd1')
	await seedUnit('c2', 'company', 'd1')
	await seedUnit('c1p1', 'platoon', 'c1')
	await seedUnit('c2p1', 'platoon', 'c2')

	await seedRoom('c1room', 'c1')
	await seedRoom('c1p1room', 'c1p1')
	await seedRoom('c2room', 'c2')

	await seedTrooper('c1trooper', 'c1p1')
	await seedTrooper('c2trooper', 'c2p1')

	const [serialized, stock] = await materialTypeRepo.create([
		{ name: 'AK', category: 'weapon', isSerialized: true },
		{ name: 'Chieu', category: 'furniture', isSerialized: false }
	])
	serializedTypeId = serialized.id
	stockTypeId = stock.id

	// What the authz middleware would compute for the leader of company 1.
	c1Scope = await unitStatsRepo.findDescendantUnitIds(ids.c1)
})

describe('importing material assets', () => {
	it('accepts rows for the callers own unit and its descendants', async () => {
		const created = await materialAssetController.create(
			[asset('c1'), asset('c1p1')],
			c1Scope
		)

		expect(created.map((a) => a.unitId).sort()).toEqual(
			[ids.c1, ids.c1p1].sort()
		)
	})

	it('rejects a row addressed to another company', async () => {
		const row = asset('c2')

		await expectApiError(
			materialAssetController.create([row], c1Scope),
			ErrCode.PermissionDenied
		)
		expect(
			(await materialAssetRepo.find({})).some(
				(a) => a.serialNumber === row.serialNumber
			)
		).toBe(false)
	})

	it('stores none of the batch when a single row is out of scope', async () => {
		const own = asset('c1')
		const foreign = asset('c2p1')

		await expectApiError(
			materialAssetController.create([own, foreign], c1Scope),
			ErrCode.PermissionDenied
		)
		const stored = (await materialAssetRepo.find({})).map(
			(a) => a.serialNumber
		)
		expect(stored).not.toContain(own.serialNumber)
		expect(stored).not.toContain(foreign.serialNumber)
	})

	it('rejects an own-unit row placed in another companys room', async () => {
		await expectApiError(
			materialAssetController.create(
				[asset('c1', { roomId: ids.c2room })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
	})

	it('rejects an own-unit row assigned to another companys trooper', async () => {
		await expectApiError(
			materialAssetController.create(
				[asset('c1', { assignedTrooperId: ids.c2trooper })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
	})

	it("accepts a room and trooper that belong to the row's own unit", async () => {
		const [created] = await materialAssetController.create(
			[
				asset('c1p1', {
					roomId: ids.c1p1room,
					assignedTrooperId: ids.c1trooper
				})
			],
			c1Scope
		)

		expect(created.roomId).toBe(ids.c1p1room)
		expect(created.assignedTrooperId).toBe(ids.c1trooper)
	})

	it("rejects a room of another unit even when it is in the caller's scope", async () => {
		await expectApiError(
			materialAssetController.create(
				[asset('c1p1', { roomId: ids.c1room })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
		await expectApiError(
			materialAssetController.create(
				[asset('c1', { roomId: ids.c1p1room })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
	})

	it("rejects a trooper of another unit even when it is in the caller's scope", async () => {
		await expectApiError(
			materialAssetController.create(
				[asset('c1', { assignedTrooperId: ids.c1trooper })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
	})

	it('reports a room that does not exist as an invalid argument', async () => {
		await expectApiError(
			materialAssetController.create(
				[asset('c1', { roomId: 999999 })],
				c1Scope
			),
			ErrCode.InvalidArgument
		)
	})

	it('lets a caller without any unit import nothing', async () => {
		await expectApiError(
			materialAssetController.create([asset('c1')], []),
			ErrCode.PermissionDenied
		)
	})

	it('does not let an update move an asset into another company', async () => {
		const [own] = await materialAssetController.create(
			[asset('c1')],
			c1Scope
		)

		await expectApiError(
			materialAssetController.update(
				[{ id: own.id, updatePayload: { unitId: ids.c2 } }],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
		await expectApiError(
			materialAssetController.update(
				[{ id: own.id, updatePayload: { roomId: ids.c2room } }],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
		const [after] = await materialAssetRepo.findByIds([own.id])
		expect(after.unitId).toBe(ids.c1)
		expect(after.roomId).toBeNull()
	})

	it('does not let an update move an asset away from the unit of its room', async () => {
		const [own] = await materialAssetController.create(
			[asset('c1', { roomId: ids.c1room })],
			c1Scope
		)

		await expectApiError(
			materialAssetController.update(
				[{ id: own.id, updatePayload: { unitId: ids.c1p1 } }],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
		const moved = await materialAssetController.update(
			[
				{
					id: own.id,
					updatePayload: { unitId: ids.c1p1, roomId: ids.c1p1room }
				}
			],
			c1Scope
		)
		expect(moved[0].unitId).toBe(ids.c1p1)
		expect(moved[0].roomId).toBe(ids.c1p1room)
	})

	it('still lets an update touch unrelated fields', async () => {
		const [own] = await materialAssetController.create(
			[asset('c1')],
			c1Scope
		)

		const [updated] = await materialAssetController.update(
			[{ id: own.id, updatePayload: { status: 'damaged' } }],
			c1Scope
		)

		expect(updated.status).toBe('damaged')
	})
})

describe('importing material stocks', () => {
	const stock = (
		unitKey: string,
		quantity: number,
		extra: Record<string, unknown> = {}
	) => ({
		materialTypeId: stockTypeId,
		unitId: ids[unitKey],
		quantity,
		...extra
	})

	const quantityOf = async (unitKey: string) =>
		(await materialStockRepo.find({ unitIds: [ids[unitKey]] })).reduce(
			(sum, s) => sum + s.quantity,
			0
		)

	it('accepts rows for the callers own unit and its descendants', async () => {
		await materialStockController.create(
			[stock('c1', 5), stock('c1p1', 7)],
			c1Scope
		)

		expect(await quantityOf('c1')).toBe(5)
		expect(await quantityOf('c1p1')).toBe(7)
	})

	it('rejects a row addressed to another company', async () => {
		await expectApiError(
			materialStockController.create([stock('c2', 3)], c1Scope),
			ErrCode.PermissionDenied
		)
		expect(await quantityOf('c2')).toBe(0)
	})

	it('cannot top up an existing stock that belongs to another company', async () => {
		await materialStockRepo.create([stock('c2p1', 10)])

		await expectApiError(
			materialStockController.create([stock('c2p1', 99)], c1Scope),
			ErrCode.PermissionDenied
		)
		expect(await quantityOf('c2p1')).toBe(10)
	})

	it('stores none of the batch when a single row is out of scope', async () => {
		const before = await quantityOf('c1')

		await expectApiError(
			materialStockController.create(
				[stock('c1', 1), stock('c2', 1)],
				c1Scope
			),
			ErrCode.PermissionDenied
		)

		expect(await quantityOf('c1')).toBe(before)
	})

	it('rejects an own-unit row placed in another companys room', async () => {
		await expectApiError(
			materialStockController.create(
				[stock('c1', 2, { roomId: ids.c2room })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
	})

	it("accepts a room that belongs to the row's own unit", async () => {
		const [created] = await materialStockController.create(
			[stock('c1p1', 2, { roomId: ids.c1p1room })],
			c1Scope
		)

		expect(created.roomId).toBe(ids.c1p1room)
	})

	it("rejects a room of another unit even when it is in the caller's scope", async () => {
		await expectApiError(
			materialStockController.create(
				[stock('c1p1', 2, { roomId: ids.c1room })],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
	})

	it('does not let an update move a stock into another company', async () => {
		const [own] = await materialStockController.create(
			[stock('c1', 1, { condition: 'fair' })],
			c1Scope
		)

		await expectApiError(
			materialStockController.update(
				[{ id: own.id, updatePayload: { unitId: ids.c2 } }],
				c1Scope
			),
			ErrCode.PermissionDenied
		)
		const [after] = await materialStockRepo.findByIds([own.id])
		expect(after.unitId).toBe(ids.c1)
	})
})
