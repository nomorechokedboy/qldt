import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { AppError } from '../errors'
import { cleanupTestDbs } from '../test-utils/test-db'
import unitRepo from '../units/repo'

// Real repo over a real database; what matters is the error a client would
// receive, so these assert on the APIError that comes out.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

async function apiErrorOf(promise: Promise<unknown>): Promise<APIError> {
	try {
		// Repos raise AppErrors; controllers turn them into API errors.
		await promise.catch(AppError.handleAppErr)
	} catch (err) {
		expect(err).toBeInstanceOf(APIError)
		return err as APIError
	}
	throw new Error('expected the promise to reject')
}

describe('errors carrying a reason for the client', () => {
	it('sends the reason and its params in the error details', () => {
		let err: unknown
		try {
			AppError.handleAppErr(
				AppError.invalidArgument('Transfer request is not pending', {
					reason: 'not_pending',
					params: { id: 4 }
				})
			)
		} catch (e) {
			err = e
		}

		expect(err).toBeInstanceOf(APIError)
		expect((err as APIError).code).toBe(ErrCode.InvalidArgument)
		expect((err as APIError).message).toBe(
			'Transfer request is not pending'
		)
		expect((err as APIError).details).toEqual({
			reason: 'not_pending',
			params: { id: 4 }
		})
	})

	it('leaves details empty when no reason was given', () => {
		try {
			AppError.handleAppErr(AppError.notFound('gone'))
		} catch (e) {
			expect((e as APIError).details).toBeUndefined()
			return
		}
		throw new Error('expected a throw')
	})

	it('names the column when a unique value is already taken', async () => {
		const [parent] = await unitRepo.create([
			{ alias: 'b0', name: 'Tieu doan 0', level: 'battalion' }
		])
		await unitRepo.create([
			{
				alias: 'c1',
				name: 'Dai doi 1',
				level: 'company',
				parentId: parent.id
			}
		])

		const err = await apiErrorOf(
			unitRepo.create([
				{
					alias: 'c1',
					name: 'Dai doi 2',
					level: 'company',
					parentId: parent.id
				}
			])
		)

		expect(err.code).toBe(ErrCode.AlreadyExists)
		expect(err.details).toEqual({
			reason: 'unique_violation',
			params: { field: 'units.alias' }
		})
	})

	it('says a record is in use when something still refers to it', async () => {
		const [parent] = await unitRepo.create([
			{ alias: 'b1', name: 'Tieu doan 1', level: 'battalion' }
		])
		await unitRepo.create([
			{
				alias: 'b1c1',
				name: 'Dai doi 1 b1',
				level: 'company',
				parentId: parent.id
			}
		])

		const err = await apiErrorOf(unitRepo.delete([parent]))

		expect(err.details).toEqual({ reason: 'in_use_or_missing_reference' })
	})
})
