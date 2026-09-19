import { APIError, ErrCode } from 'encore.dev/api'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { cleanupTestDbs } from '../test-utils/test-db'
import { UnitDB, UnitParams } from '../schema/units'
import unitController from './controller'

// Exercises the controller through its public methods against a real
// database and asserts only on outcomes (what is returned, what is stored,
// which API error a caller receives) - never on how the repo is called - so
// the tests keep holding when the internals are reshaped.
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

async function expectApiError(
	promise: Promise<unknown>,
	code: ErrCode,
	message?: RegExp
) {
	const err = await rejection(promise)

	expect(err).toBeInstanceOf(APIError)
	expect((err as APIError).code).toBe(code)
	if (message) {
		expect((err as APIError).message).toMatch(message)
	}
}

const idsOf = (units: { id: number }[]) => units.map((u) => u.id).sort()

const ids: Record<string, number> = {}

async function create(
	key: string,
	params: UnitParams,
	scope?: { validUnitIds: number[]; actorUnitId: number }
) {
	const [created] = await unitController.create([params], scope)
	ids[key] = (created as UnitDB).id
	return created as UnitDB
}

const allIds = () => Object.values(ids)

describe('root unit initialization', () => {
	it('starts uninitialized, then reports the root once initialized', async () => {
		expect(await unitController.isInitRootUnit()).toEqual({
			initialized: false
		})

		const root = await unitController.initRootUnit({
			alias: 'd1',
			name: 'Tieu doan 1',
			level: 'battalion'
		})
		ids.d1 = (root as UnitDB).id

		expect(await unitController.isInitRootUnit()).toEqual({
			initialized: true,
			rootUnitId: ids.d1
		})
	})

	it('refuses to initialize a second root', async () => {
		await expectApiError(
			unitController.initRootUnit({
				alias: 'other',
				name: 'Other',
				level: 'battalion'
			}),
			ErrCode.Unavailable
		)
	})

	it('rejects a root smaller than a company', async () => {
		await expectApiError(
			unitController.create([
				{ alias: 'p', name: 'P', level: 'platoon' }
			]),
			ErrCode.InvalidArgument,
			/Company level or larger/
		)
	})
})

// Builds the tree the remaining suites rely on (aliases repeat under
// different parents on purpose):
//   d1 (battalion)
//   |- c1 (company) - bch (platoon), p1 (platoon)
//   `- c2 (company) - bch (platoon), p1 (platoon)
describe('unit hierarchy', () => {
	it('allows the same alias under different parents', async () => {
		await create('c1', {
			alias: 'c1',
			name: 'Dai doi 1',
			level: 'company',
			parentId: ids.d1
		})
		await create('c2', {
			alias: 'c2',
			name: 'Dai doi 2',
			level: 'company',
			parentId: ids.d1
		})
		for (const c of ['c1', 'c2']) {
			await create(`${c}bch`, {
				alias: 'bch',
				name: `Ban chi huy ${c}`,
				level: 'platoon',
				parentId: ids[c]
			})
			await create(`${c}p1`, {
				alias: 'p1',
				name: `Trung doi 1 ${c}`,
				level: 'platoon',
				parentId: ids[c]
			})
		}

		expect(allIds()).toHaveLength(7)
		expect(
			(await unitController.find({}, allIds())).filter(
				(u) => u.alias === 'bch'
			)
		).toHaveLength(2)
	})
})

describe('unitController.find', () => {
	it('returns nothing when the caller can see no units', async () => {
		expect(await unitController.find({}, [])).toEqual([])
		expect(
			await unitController.find({}, undefined as unknown as number[])
		).toEqual([])
	})

	it('returns exactly the units the caller may see', async () => {
		const visible = [ids.c1, ids.c1bch]

		const units = await unitController.find({}, visible)

		expect(idsOf(units)).toEqual([...visible].sort())
	})

	it('never returns a unit outside the callers scope', async () => {
		const units = await unitController.find({}, [ids.c1])

		expect(idsOf(units)).toEqual([ids.c1])
	})

	it('ignores scope ids that do not exist', async () => {
		const units = await unitController.find({}, [ids.c1, 999999])

		expect(idsOf(units)).toEqual([ids.c1])
	})

	it('filters by level within the callers scope', async () => {
		const units = await unitController.find({ level: 'company' }, allIds())

		expect(idsOf(units)).toEqual([ids.c1, ids.c2].sort())
	})

	it('returns an empty list when no visible unit has the level', async () => {
		expect(await unitController.find({ level: 'squad' }, allIds())).toEqual(
			[]
		)
	})

	it('includes each units parent and children', async () => {
		const [company] = await unitController.find({ level: 'company' }, [
			ids.c1
		])

		expect(company.parent?.id).toBe(ids.d1)
		expect(idsOf(company.children ?? [])).toEqual(
			[ids.c1bch, ids.c1p1].sort()
		)
	})
})

describe('unitController.findOne', () => {
	it('returns the unit with its parent and nested children', async () => {
		const unit = await unitController.findOne(ids.d1, allIds())

		expect(unit?.id).toBe(ids.d1)
		expect(unit?.parent).toBeFalsy()
		expect(idsOf(unit?.children ?? [])).toEqual([ids.c1, ids.c2].sort())

		const c1 = unit?.children?.find((c) => c.id === ids.c1)
		expect(idsOf(c1?.children ?? [])).toEqual([ids.c1bch, ids.c1p1].sort())
	})

	it('resolves each of several same-alias units by its own id', async () => {
		const first = await unitController.findOne(ids.c1bch, allIds())
		const second = await unitController.findOne(ids.c2bch, allIds())

		expect(first?.alias).toBe('bch')
		expect(second?.alias).toBe('bch')
		expect(first?.id).toBe(ids.c1bch)
		expect(second?.id).toBe(ids.c2bch)
		expect(first?.parent?.id).toBe(ids.c1)
		expect(second?.parent?.id).toBe(ids.c2)
	})

	it('reports an unknown unit as invalid_argument', async () => {
		await expectApiError(
			unitController.findOne(999999, allIds()),
			ErrCode.InvalidArgument
		)
	})

	it('refuses a unit outside the callers scope with permission_denied', async () => {
		await expectApiError(
			unitController.findOne(ids.c2, [ids.c1]),
			ErrCode.PermissionDenied
		)
	})

	it('refuses everything when the caller has no valid units', async () => {
		await expectApiError(
			unitController.findOne(ids.c1, []),
			ErrCode.PermissionDenied
		)
	})
})

describe('unitController.create', () => {
	it('rejects an empty request', async () => {
		await expectApiError(unitController.create([]), ErrCode.InvalidArgument)
	})

	it('rejects a parent that does not exist', async () => {
		await expectApiError(
			unitController.create([
				{ alias: 'x', name: 'X', level: 'platoon', parentId: 999999 }
			]),
			ErrCode.InvalidArgument
		)
	})

	it('rejects a child at the same level as its parent', async () => {
		await expectApiError(
			unitController.create([
				{ alias: 'c9', name: 'C9', level: 'company', parentId: ids.c1 }
			]),
			ErrCode.InvalidArgument
		)
	})

	it('rejects a child larger than its parent', async () => {
		await expectApiError(
			unitController.create([
				{
					alias: 'b9',
					name: 'B9',
					level: 'battalion',
					parentId: ids.c1
				}
			]),
			ErrCode.InvalidArgument
		)
	})

	it('rejects an unknown commander user', async () => {
		await expectApiError(
			unitController.create([
				{
					alias: 'x',
					name: 'X',
					level: 'platoon',
					parentId: ids.c1,
					commanderId: 999999
				}
			]),
			ErrCode.InvalidArgument
		)
	})

	it('stores a valid child so it can be read back', async () => {
		const created = await create('c1p2', {
			alias: 'p2',
			name: 'Trung doi 2 c1',
			level: 'platoon',
			parentId: ids.c1
		})

		const found = await unitController.findOne(created.id, allIds())
		expect(found?.name).toBe('Trung doi 2 c1')
		expect(found?.parent?.id).toBe(ids.c1)
	})

	it('rejects a duplicate alias under the same parent', async () => {
		await expectApiError(
			unitController.create([
				{
					alias: 'p1',
					name: 'Another platoon',
					level: 'platoon',
					parentId: ids.c1
				}
			]),
			ErrCode.AlreadyExists
		)
	})

	it('rejects a duplicate name under the same parent', async () => {
		await expectApiError(
			unitController.create([
				{
					alias: 'unique',
					name: 'Trung doi 1 c1',
					level: 'platoon',
					parentId: ids.c1
				}
			]),
			ErrCode.AlreadyExists
		)
	})

	describe('as a non-super-admin actor', () => {
		it('may create below their own unit', async () => {
			const created = await create(
				'c1p4',
				{
					alias: 'p4',
					name: 'Trung doi 4 c1',
					level: 'platoon',
					parentId: ids.c1
				},
				{ validUnitIds: [ids.c1, ids.c1bch], actorUnitId: ids.c1 }
			)

			expect(created.parentId).toBe(ids.c1)
		})

		it('may not create under a parent outside their scope', async () => {
			await expectApiError(
				unitController.create(
					[
						{
							alias: 'zz',
							name: 'ZZ',
							level: 'platoon',
							parentId: ids.c2
						}
					],
					{ validUnitIds: [ids.c1], actorUnitId: ids.c1 }
				),
				ErrCode.PermissionDenied
			)
		})

		it('may not create a unit at or above their own level', async () => {
			await expectApiError(
				unitController.create(
					[
						{
							alias: 'zz',
							name: 'ZZ',
							level: 'company',
							parentId: ids.d1
						}
					],
					{ validUnitIds: [ids.d1, ids.c1], actorUnitId: ids.c1 }
				),
				ErrCode.PermissionDenied
			)
		})

		it('may not create a root unit', async () => {
			await expectApiError(
				unitController.create(
					[{ alias: 'zz', name: 'ZZ', level: 'company' }],
					{ validUnitIds: [ids.c1], actorUnitId: ids.c1 }
				),
				ErrCode.PermissionDenied
			)
		})

		it('is refused when their own unit no longer exists', async () => {
			await expectApiError(
				unitController.create(
					[
						{
							alias: 'zz',
							name: 'ZZ',
							level: 'platoon',
							parentId: ids.c1
						}
					],
					{ validUnitIds: [ids.c1], actorUnitId: 999999 }
				),
				ErrCode.PermissionDenied
			)
		})
	})
})

describe('unitController.update', () => {
	const superAdmin = { isSuperAdmin: true }
	const commander = { isSuperAdmin: false, actorUnitId: 0 }

	it('rejects an empty request', async () => {
		await expectApiError(
			unitController.update([], allIds(), superAdmin),
			ErrCode.InvalidArgument
		)
	})

	it('refuses units outside the callers scope', async () => {
		await expectApiError(
			unitController.update(
				[{ id: ids.c2, name: 'renamed' } as UnitDB],
				[ids.c1],
				superAdmin
			),
			ErrCode.PermissionDenied
		)
	})

	it('reports an unknown unit', async () => {
		await expectApiError(
			unitController.update(
				[{ id: 999999, name: 'ghost' } as UnitDB],
				[999999],
				superAdmin
			),
			ErrCode.InvalidArgument
		)
	})

	it('changes only the addressed unit, even when others share its alias', async () => {
		await unitController.update(
			[{ id: ids.c1bch, name: 'Ban chi huy (moi)' } as UnitDB],
			allIds(),
			superAdmin
		)

		expect((await unitController.findOne(ids.c1bch, allIds()))?.name).toBe(
			'Ban chi huy (moi)'
		)
		expect((await unitController.findOne(ids.c2bch, allIds()))?.name).toBe(
			'Ban chi huy c2'
		)
	})

	it('lets a super admin move a unit under a different parent', async () => {
		await unitController.update(
			[{ id: ids.c1p2, parentId: ids.c2 } as UnitDB],
			allIds(),
			superAdmin
		)

		const moved = await unitController.findOne(ids.c1p2, allIds())
		expect(moved?.parent?.id).toBe(ids.c2)
	})

	it('does not let a non-super-admin change a units parent', async () => {
		await expectApiError(
			unitController.update(
				[{ id: ids.c1p4, parentId: ids.c2 } as UnitDB],
				allIds(),
				commander
			),
			ErrCode.PermissionDenied
		)
		expect(
			(await unitController.findOne(ids.c1p4, allIds()))?.parent?.id
		).toBe(ids.c1)
	})

	it('does not let a non-super-admin change a units level', async () => {
		await expectApiError(
			unitController.update(
				[{ id: ids.c1p4, level: 'squad' } as UnitDB],
				allIds(),
				commander
			),
			ErrCode.PermissionDenied
		)
	})

	it('rejects making a unit its own parent', async () => {
		await expectApiError(
			unitController.update(
				[{ id: ids.c1p4, parentId: ids.c1p4 } as UnitDB],
				allIds(),
				superAdmin
			),
			ErrCode.InvalidArgument
		)
	})

	it('rejects a rename that collides with a sibling', async () => {
		await expectApiError(
			unitController.update(
				[{ id: ids.c1p4, alias: 'p1' } as UnitDB],
				allIds(),
				superAdmin
			),
			ErrCode.AlreadyExists
		)
	})
})

describe('unitController.delete', () => {
	const asUnit = (id: number) => ({ id }) as UnitDB

	it('is only for super admins', async () => {
		await expectApiError(
			unitController.delete([asUnit(ids.c1p4)], allIds(), false),
			ErrCode.PermissionDenied
		)
		expect(await unitController.findOne(ids.c1p4, allIds())).toBeDefined()
	})

	it('refuses units outside the callers scope', async () => {
		await expectApiError(
			unitController.delete([asUnit(ids.c1p4)], [ids.c1], true),
			ErrCode.PermissionDenied
		)
		expect(await unitController.findOne(ids.c1p4, allIds())).toBeDefined()
	})

	it('refuses to delete the root unit and leaves everything in place', async () => {
		await expectApiError(
			unitController.delete(
				[asUnit(ids.d1), asUnit(ids.c1p4)],
				allIds(),
				true
			),
			ErrCode.InvalidArgument
		)

		expect(await unitController.findOne(ids.d1, allIds())).toBeDefined()
		expect(await unitController.findOne(ids.c1p4, allIds())).toBeDefined()
	})

	it('deletes only the requested unit, not others sharing its alias', async () => {
		await unitController.delete([asUnit(ids.c1bch)], allIds(), true)

		await expectApiError(
			unitController.findOne(ids.c1bch, allIds()),
			ErrCode.InvalidArgument
		)
		expect((await unitController.findOne(ids.c2bch, allIds()))?.id).toBe(
			ids.c2bch
		)
	})
})
