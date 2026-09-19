import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import unitRepo from '../units/repo'
import unitStatsRepo from '../units/stats-repo'
import { cleanupTestDbs } from '../test-utils/test-db'
import materialAssetController from './material-assets-controller'
import materialAssetRepo from './material-assets-repo'
import materialTypeController from './material-types-controller'
import materialTypeRepo from './material-types-repo'

vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

async function expectInvalid(promise: Promise<unknown>) {
	let err: unknown
	try {
		await promise
	} catch (e) {
		err = e
	}

	expect(err).toBeInstanceOf(APIError)
	expect((err as APIError).code).toBe(ErrCode.InvalidArgument)
}

let unitId: number
let scope: number[]
let typeId: number

beforeAll(async () => {
	const [unit] = await unitRepo.create([
		{ alias: 'c1', name: 'c1', level: 'company' }
	])
	unitId = unit.id
	scope = await unitStatsRepo.findDescendantUnitIds(unitId)
	;[{ id: typeId }] = await materialTypeRepo.create([
		{ name: 'AK', category: 'weapon', isSerialized: true }
	])
})

const typeNames = async () =>
	(await materialTypeRepo.find({})).map((t) => t.name)
const serials = async () =>
	(await materialAssetRepo.find({})).map((a) => a.serialNumber)

describe('material type name length', () => {
	it('accepts a name of exactly 30 characters', async () => {
		const name = 'a'.repeat(30)

		const [created] = await materialTypeController.create([
			{ name, category: 'weapon', isSerialized: true }
		])

		expect(created.name).toBe(name)
	})

	it('counts accented Vietnamese letters as one character each', async () => {
		const name = 'Súng trường bộ binh tự động ạ'
			.padEnd(30, 'ạ')
			.slice(0, 30)

		const [created] = await materialTypeController.create([
			{ name, category: 'weapon', isSerialized: true }
		])

		expect(created.name).toBe(name)
	})

	it('rejects a name of 31 characters and stores nothing', async () => {
		const name = 'b'.repeat(31)

		await expectInvalid(
			materialTypeController.create([
				{ name, category: 'weapon', isSerialized: true }
			])
		)
		expect(await typeNames()).not.toContain(name)
	})

	it('rejects the whole batch when one name is too long', async () => {
		const ok = 'batch-ok'

		await expectInvalid(
			materialTypeController.create([
				{ name: ok, category: 'weapon', isSerialized: true },
				{ name: 'c'.repeat(31), category: 'weapon', isSerialized: true }
			])
		)
		expect(await typeNames()).not.toContain(ok)
	})

	it('rejects renaming a type to a name that is too long', async () => {
		await expectInvalid(
			materialTypeController.update([
				{ id: typeId, updatePayload: { name: 'd'.repeat(31) } }
			])
		)
		expect(await typeNames()).toContain('AK')
	})
})

describe('material asset serial length', () => {
	const asset = (serialNumber: string) => ({
		materialTypeId: typeId,
		unitId,
		serialNumber
	})

	it('accepts a serial of exactly 20 characters', async () => {
		const serial = 'S'.repeat(20)

		const [created] = await materialAssetController.create(
			[asset(serial)],
			scope
		)

		expect(created.serialNumber).toBe(serial)
	})

	it('rejects a serial of 21 characters and stores nothing', async () => {
		const serial = 'T'.repeat(21)

		await expectInvalid(
			materialAssetController.create([asset(serial)], scope)
		)
		expect(await serials()).not.toContain(serial)
	})

	it('rejects the whole batch when one serial is too long', async () => {
		await expectInvalid(
			materialAssetController.create(
				[asset('batch-ok-serial'), asset('U'.repeat(21))],
				scope
			)
		)
		expect(await serials()).not.toContain('batch-ok-serial')
	})

	it('rejects changing a serial to one that is too long', async () => {
		const [own] = await materialAssetController.create(
			[asset('short-serial')],
			scope
		)

		await expectInvalid(
			materialAssetController.update(
				[
					{
						id: own.id,
						updatePayload: { serialNumber: 'V'.repeat(21) }
					}
				],
				scope
			)
		)
		const [after] = await materialAssetRepo.findByIds([own.id])
		expect(after.serialNumber).toBe('short-serial')
	})
})
