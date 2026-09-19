import argon2 from 'argon2'
import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { appConfig } from '../configs'
import { cleanupTestDbs } from '../test-utils/test-db'
import userRepo from '../users/repo'
import authController from './controller'

// Real repos over a real database; assertions are on outcomes only.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

async function rejection(promise: Promise<unknown> | (() => unknown)) {
	try {
		await (typeof promise === 'function' ? promise() : promise)
	} catch (err) {
		return err
	}
	throw new Error('expected the call to reject')
}

async function expectApiError(
	promise: Promise<unknown> | (() => unknown),
	code: ErrCode
) {
	const err = await rejection(promise)

	expect(err).toBeInstanceOf(APIError)
	expect((err as APIError).code).toBe(code)
}

const PASSWORD = 'correct-horse'
let userId: number

beforeAll(async () => {
	const password = await argon2.hash(PASSWORD, {
		secret: Buffer.from(appConfig.HASH_SECRET)
	})
	const user = await userRepo.create({
		username: 'alice',
		password,
		displayName: 'Alice',
		isSuperUser: false
	} as Parameters<typeof userRepo.create>[0])
	userId = user.id
})

describe('authController.login', () => {
	it('returns an access and a refresh token for valid credentials', async () => {
		const tokens = await authController.login({
			username: 'alice',
			password: PASSWORD
		})

		expect(tokens.accessToken).toBeTruthy()
		expect(tokens.refreshToken).toBeTruthy()
	})

	it('rejects a wrong password as invalid_argument', async () => {
		await expectApiError(
			authController.login({ username: 'alice', password: 'nope' }),
			ErrCode.InvalidArgument
		)
	})

	it('rejects an unknown username the same way as a wrong password', async () => {
		const unknown = await rejection(
			authController.login({ username: 'ghost', password: PASSWORD })
		)
		const wrong = await rejection(
			authController.login({ username: 'alice', password: 'nope' })
		)

		expect(unknown).toBeInstanceOf(APIError)
		expect((unknown as APIError).code).toBe(ErrCode.InvalidArgument)
		expect((unknown as APIError).message).toBe((wrong as APIError).message)
	})
})

describe('authController.refreshToken', () => {
	it('issues a new access token for a valid refresh token', async () => {
		const { refreshToken } = await authController.login({
			username: 'alice',
			password: PASSWORD
		})

		const refreshed = await authController.refreshToken({
			token: refreshToken
		})

		expect(refreshed.accessToken).toBeTruthy()
		expect(refreshed.refreshToken).toBe(refreshToken)
	})

	it('refuses an access token in place of a refresh token', async () => {
		const { accessToken } = await authController.login({
			username: 'alice',
			password: PASSWORD
		})

		await expectApiError(
			authController.refreshToken({ token: accessToken }),
			ErrCode.Unauthenticated
		)
	})

	it('refuses a malformed token', async () => {
		await expectApiError(
			authController.refreshToken({ token: 'not-a-jwt' }),
			ErrCode.Unauthenticated
		)
	})
})

describe('authController.verifyToken', () => {
	it('reports a malformed token as unauthenticated', async () => {
		await expectApiError(
			async () => authController.verifyToken('garbage'),
			ErrCode.Unauthenticated
		)
	})
})

describe('authController.changePassword', () => {
	it('lets the user log in with the new password afterwards', async () => {
		await authController.changePassword({
			userId,
			prevPassword: PASSWORD,
			password: 'new-password'
		})

		await expect(
			authController.login({
				username: 'alice',
				password: 'new-password'
			})
		).resolves.toBeTruthy()
		await expectApiError(
			authController.login({ username: 'alice', password: PASSWORD }),
			ErrCode.InvalidArgument
		)
	})

	it('rejects a wrong previous password as invalid_argument', async () => {
		await expectApiError(
			authController.changePassword({
				userId,
				prevPassword: 'wrong',
				password: 'whatever'
			}),
			ErrCode.InvalidArgument
		)
	})

	it('reports an unknown user as not_found', async () => {
		await expectApiError(
			authController.changePassword({
				userId: 999999,
				prevPassword: PASSWORD,
				password: 'whatever'
			}),
			ErrCode.NotFound
		)
	})
})
