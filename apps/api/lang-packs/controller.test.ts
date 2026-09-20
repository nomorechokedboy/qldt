import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { cleanupTestDbs } from '../test-utils/test-db'
import langPackController from './controller'
import { MAX_LANG_PACK_BYTES } from './validate'

// Exercises the controller through its public methods against a real
// database and asserts only on outcomes: what callers can read back and
// which API error they receive.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

const superAdmin = { isSuperAdmin: true, userId: 1 }
const regularUser = { isSuperAdmin: false, userId: 2 }

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

describe('lang packs', () => {
	it('starts with no packs', async () => {
		expect(await langPackController.find()).toEqual({})
	})

	it('lets a super admin upload a pack and anyone read it back', async () => {
		const pack = { common: { actions: { save: 'Ghi lại' } } }

		await langPackController.replace('vi', pack, superAdmin)

		expect(await langPackController.find()).toEqual({ vi: pack })
	})

	it('replaces the previous pack for that language and leaves the others', async () => {
		await langPackController.replace(
			'en',
			{ auth: { login: { title: 'Sign in' } } },
			superAdmin
		)
		const { previous, current } = await langPackController.replace(
			'vi',
			{ nav: { home: 'Trang chủ' } },
			superAdmin
		)

		expect(previous).toEqual({ common: { actions: { save: 'Ghi lại' } } })
		expect(current).toEqual({ nav: { home: 'Trang chủ' } })
		expect(await langPackController.find()).toEqual({
			vi: { nav: { home: 'Trang chủ' } },
			en: { auth: { login: { title: 'Sign in' } } }
		})
	})

	it('removes only the requested language', async () => {
		await langPackController.remove('vi', superAdmin)

		expect(Object.keys(await langPackController.find())).toEqual(['en'])
	})

	it('rejects non-super-admins and leaves the stored pack untouched', async () => {
		const before = await langPackController.find()

		await expectApiError(
			langPackController.replace(
				'en',
				{ common: { a: 'b' } },
				regularUser
			),
			'permission_denied'
		)
		await expectApiError(
			langPackController.remove('en', regularUser),
			'permission_denied'
		)

		expect(await langPackController.find()).toEqual(before)
	})

	it.each([
		['an unsupported language', 'fr', { common: { a: 'b' } }],
		['a non-object pack', 'en', ['nope']],
		['a non-string value', 'en', { common: { count: 3 } }],
		['a namespace that is not an object', 'en', { common: 'text' }],
		['an empty pack', 'en', {}],
		['a pack with only empty namespaces', 'en', { common: {} }],
		[
			'a prototype-polluting key',
			'en',
			JSON.parse('{"common":{"__proto__":{"x":"y"}}}')
		],
		['an invalid namespace name', 'en', { 'bad ns': { a: 'b' } }],
		[
			'a pack over the size limit',
			'en',
			{ common: { big: 'x'.repeat(MAX_LANG_PACK_BYTES) } }
		]
	])('rejects %s', async (_label, language, pack) => {
		const before = await langPackController.find()

		await expectApiError(
			langPackController.replace(language, pack, superAdmin),
			'invalid_argument'
		)

		expect(await langPackController.find()).toEqual(before)
	})

	it('rejects deleting an unsupported language', async () => {
		await expectApiError(
			langPackController.remove('fr', superAdmin),
			'invalid_argument'
		)
	})
})
