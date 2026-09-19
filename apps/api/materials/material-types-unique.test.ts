import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { cleanupTestDbs } from '../test-utils/test-db'
import materialTypeController from './material-types-controller'
import materialTypeRepo from './material-types-repo'

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

const type = (name: string, unitOfMeasure?: string) => ({
	name,
	unitOfMeasure,
	category: 'furniture' as const,
	isSerialized: false
})

const countNamed = async (name: string) =>
	(await materialTypeRepo.find({})).filter((t) => t.name === name).length

describe('material type uniqueness', () => {
	it('allows the same name with a different unit of measure', async () => {
		await materialTypeController.create([type('Chiếu', 'cái')])

		const [other] = await materialTypeController.create([
			type('Chiếu', 'bộ')
		])

		expect(other.unitOfMeasure).toBe('bộ')
		expect(await countNamed('Chiếu')).toBe(2)
	})

	it('rejects the same name with the same unit of measure', async () => {
		await materialTypeController.create([type('Ghế', 'cái')])

		await expectApiError(
			materialTypeController.create([type('Ghế', 'cái')]),
			ErrCode.AlreadyExists
		)
		expect(await countNamed('Ghế')).toBe(1)
	})

	it('treats an omitted unit as the default unit', async () => {
		await materialTypeController.create([type('Bàn')])

		await expectApiError(
			materialTypeController.create([type('Bàn', 'cái')]),
			ErrCode.AlreadyExists
		)
		expect(await countNamed('Bàn')).toBe(1)
	})

	it('rejects the whole batch when one entry collides', async () => {
		await materialTypeController.create([type('Tủ', 'cái')])

		await expectApiError(
			materialTypeController.create([
				type('Kệ', 'cái'),
				type('Tủ', 'cái')
			]),
			ErrCode.AlreadyExists
		)
		expect(await countNamed('Kệ')).toBe(0)
	})

	it('rejects changing a type into another type with the same name and unit', async () => {
		const [a] = await materialTypeController.create([type('Đèn', 'cái')])
		const [b] = await materialTypeController.create([type('Đèn', 'bộ')])

		await expectApiError(
			materialTypeController.update([
				{ id: b.id, updatePayload: { unitOfMeasure: 'cái' } }
			]),
			ErrCode.AlreadyExists
		)
		const stored = await materialTypeRepo.find({ ids: [a.id, b.id] })
		expect(stored.map((t) => t.unitOfMeasure).sort()).toEqual(['bộ', 'cái'])
	})
})
