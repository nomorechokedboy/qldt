import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AppError } from '../errors'
import { cleanupTestDbs } from '../test-utils/test-db'
import { UnitDB, UnitParams } from '../schema/units'
import unitRepo from './repo'

// Runs against a real in-memory sqlite database (same drizzle schema and
// migrations as production) so filters, LIKE escaping, NULL matching and the
// unique(alias, parentId) constraint are exercised for real rather than
// against a fake.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

// The tree deliberately repeats aliases under different parents - the exact
// shape (every company owning a "bch" platoon) that alias/level lookups could
// not tell apart:
//
//   d1 (battalion)
//   |- c1 (company)
//   |   |- bch (platoon, "Ban chi huy C1")
//   |   |   `- bch (squad)
//   |   `- p1 (platoon)
//   `- c2 (company)
//       |- bch (platoon, "Ban chi huy C2")
//       `- p1 (platoon)
const ids: Record<string, number> = {}

async function seed(key: string, params: UnitParams): Promise<UnitDB> {
	const [created] = await unitRepo.create([params])
	ids[key] = created.id

	return created
}

beforeAll(async () => {
	await seed('d1', { alias: 'd1', name: 'Tieu doan 1', level: 'battalion' })
	await seed('c1', {
		alias: 'c1',
		name: 'Dai doi 1',
		level: 'company',
		parentId: ids.d1
	})
	await seed('c2', {
		alias: 'c2',
		name: 'Dai doi 2',
		level: 'company',
		parentId: ids.d1
	})
	await seed('c1bch', {
		alias: 'bch',
		name: 'Ban chi huy C1',
		level: 'platoon',
		parentId: ids.c1
	})
	await seed('c1p1', {
		alias: 'p1',
		name: 'Trung doi 1 C1',
		level: 'platoon',
		parentId: ids.c1
	})
	await seed('c2bch', {
		alias: 'bch',
		name: 'Ban chi huy C2',
		level: 'platoon',
		parentId: ids.c2
	})
	await seed('c2p1', {
		alias: 'p1',
		name: 'Trung doi 1 C2',
		level: 'platoon',
		parentId: ids.c2
	})
	await seed('c1bchSquad', {
		alias: 'bch',
		name: 'Tieu doi chi huy C1',
		level: 'squad',
		parentId: ids.c1bch
	})
})

afterAll(cleanupTestDbs)

const idsOf = (units: { id: number }[]) => units.map((u) => u.id)

async function rejection(promise: Promise<unknown>): Promise<unknown> {
	try {
		await promise
	} catch (err) {
		return err
	}
	throw new Error('expected the promise to reject')
}

async function expectInvalidArgument(
	promise: Promise<unknown>,
	message: RegExp
) {
	const err = await rejection(promise)

	expect(err).toBeInstanceOf(AppError)
	expect((err as AppError).type).toBe('InvalidArgument')
	expect((err as AppError).message).toMatch(message)
}

describe('unitRepo.find', () => {
	describe('basic', () => {
		it('returns every unit ordered by id', async () => {
			const units = await unitRepo.find()

			expect(idsOf(units)).toEqual(
				Object.values(ids).sort((a, b) => a - b)
			)
		})

		it('treats an empty query the same as no query', async () => {
			expect(idsOf(await unitRepo.find({}))).toEqual(
				idsOf(await unitRepo.find())
			)
		})

		it('does not hydrate relations unless asked to', async () => {
			const [unit] = await unitRepo.find({ ids: [ids.c1] })

			expect(unit.children).toBeUndefined()
			expect(unit.parent).toBeUndefined()
		})

		it('returns parentId on every row', async () => {
			const [unit] = await unitRepo.find({ ids: [ids.c1] })

			expect(unit.parentId).toBe(ids.d1)
		})
	})

	describe('filters', () => {
		it('filters by ids', async () => {
			const units = await unitRepo.find({ ids: [ids.c2, ids.c1] })

			expect(idsOf(units)).toEqual([ids.c1, ids.c2])
		})

		it('ignores ids that do not exist', async () => {
			const units = await unitRepo.find({ ids: [ids.c1, 999_999] })

			expect(idsOf(units)).toEqual([ids.c1])
		})

		it('returns nothing for an unknown id', async () => {
			expect(await unitRepo.find({ ids: [999_999] })).toEqual([])
		})

		it('returns nothing for an explicit empty id list instead of every unit', async () => {
			expect(await unitRepo.find({ ids: [] })).toEqual([])
		})

		it('filters by level', async () => {
			const units = await unitRepo.find({ level: 'company' })

			expect(idsOf(units)).toEqual([ids.c1, ids.c2])
		})

		it('returns every unit sharing an alias, across parents and levels', async () => {
			const units = await unitRepo.find({ alias: 'bch' })

			expect(idsOf(units)).toEqual([ids.c1bch, ids.c2bch, ids.c1bchSquad])
		})

		it('narrows a duplicated alias with level', async () => {
			const units = await unitRepo.find({
				alias: 'bch',
				level: 'platoon'
			})

			expect(idsOf(units)).toEqual([ids.c1bch, ids.c2bch])
		})

		it('narrows a duplicated alias to a single unit with parentId', async () => {
			const units = await unitRepo.find({
				alias: 'bch',
				parentId: ids.c2
			})

			expect(idsOf(units)).toEqual([ids.c2bch])
		})

		it('filters by parentId', async () => {
			const units = await unitRepo.find({ parentId: ids.c1 })

			expect(idsOf(units)).toEqual([ids.c1bch, ids.c1p1])
		})

		it('matches root units when parentId is null', async () => {
			const units = await unitRepo.find({ parentId: null })

			expect(idsOf(units)).toEqual([ids.d1])
		})

		it('returns nothing for a parent without children', async () => {
			expect(await unitRepo.find({ parentId: ids.c2p1 })).toEqual([])
		})

		it('combines every filter with AND', async () => {
			const units = await unitRepo.find({
				ids: [ids.c1bch, ids.c2bch, ids.c1p1],
				level: 'platoon',
				alias: 'bch',
				parentId: ids.c1
			})

			expect(idsOf(units)).toEqual([ids.c1bch])
		})

		it('returns nothing when filters contradict each other', async () => {
			expect(
				await unitRepo.find({ ids: [ids.c1], level: 'platoon' })
			).toEqual([])
		})
	})

	describe('search', () => {
		it('matches on alias', async () => {
			const units = await unitRepo.find({ search: 'p1' })

			expect(idsOf(units)).toEqual([ids.c1p1, ids.c2p1])
		})

		it('matches on name', async () => {
			const units = await unitRepo.find({ search: 'Ban chi huy' })

			expect(idsOf(units)).toEqual([ids.c1bch, ids.c2bch])
		})

		it('is a substring match', async () => {
			const units = await unitRepo.find({ search: 'oan 1' })

			expect(idsOf(units)).toEqual([ids.d1])
		})

		it('is case-insensitive', async () => {
			expect(
				idsOf(await unitRepo.find({ search: 'BAN CHI HUY' }))
			).toEqual([ids.c1bch, ids.c2bch])
			expect(idsOf(await unitRepo.find({ search: 'D1' }))).toEqual([
				ids.d1
			])
		})

		it('trims surrounding whitespace', async () => {
			const units = await unitRepo.find({ search: '  Dai doi 2  ' })

			expect(idsOf(units)).toEqual([ids.c2])
		})

		it('ignores a blank search', async () => {
			expect(await unitRepo.find({ search: '   ' })).toHaveLength(
				Object.keys(ids).length
			)
			expect(await unitRepo.find({ search: '' })).toHaveLength(
				Object.keys(ids).length
			)
		})

		it('returns nothing when nothing matches', async () => {
			expect(await unitRepo.find({ search: 'does-not-exist' })).toEqual(
				[]
			)
		})

		it('treats LIKE wildcards as literal characters', async () => {
			expect(await unitRepo.find({ search: '%' })).toEqual([])
			expect(await unitRepo.find({ search: '_' })).toEqual([])
			expect(await unitRepo.find({ search: 'd_' })).toEqual([])
			expect(await unitRepo.find({ search: '\\' })).toEqual([])
		})

		it('does not let quotes break out of the query', async () => {
			expect(await unitRepo.find({ search: "x' OR '1'='1" })).toEqual([])
		})

		it('combines with other filters', async () => {
			const units = await unitRepo.find({
				search: 'bch',
				level: 'platoon',
				parentId: ids.c1
			})

			expect(idsOf(units)).toEqual([ids.c1bch])
		})
	})

	describe('pagination', () => {
		const total = () => Object.keys(ids).length

		it('returns the first page', async () => {
			const units = await unitRepo.find({ page: 1, pageSize: 3 })

			expect(idsOf(units)).toEqual(
				idsOf(await unitRepo.find()).slice(0, 3)
			)
		})

		it('returns later pages in the same order', async () => {
			const all = idsOf(await unitRepo.find())

			expect(
				idsOf(await unitRepo.find({ page: 2, pageSize: 3 }))
			).toEqual(all.slice(3, 6))
		})

		it('returns a partial last page', async () => {
			const all = idsOf(await unitRepo.find())
			const lastPage = Math.ceil(total() / 3)

			expect(
				idsOf(await unitRepo.find({ page: lastPage, pageSize: 3 }))
			).toEqual(all.slice((lastPage - 1) * 3))
		})

		it('returns an empty page past the end', async () => {
			expect(await unitRepo.find({ page: 99, pageSize: 3 })).toEqual([])
		})

		it('defaults to the first page when only pageSize is given', async () => {
			expect(idsOf(await unitRepo.find({ pageSize: 2 }))).toEqual(
				idsOf(await unitRepo.find({ page: 1, pageSize: 2 }))
			)
		})

		it('returns everything when pageSize is larger than the table', async () => {
			expect(
				await unitRepo.find({ page: 1, pageSize: 500 })
			).toHaveLength(total())
		})

		it('ignores page when there is no pageSize', async () => {
			expect(await unitRepo.find({ page: 3 })).toHaveLength(total())
		})

		it('pages through every unit exactly once', async () => {
			const seen: number[] = []
			for (let page = 1; page <= total(); page++) {
				seen.push(...idsOf(await unitRepo.find({ page, pageSize: 3 })))
			}

			expect(seen).toEqual(idsOf(await unitRepo.find()))
			expect(new Set(seen).size).toBe(seen.length)
		})

		it('paginates after filtering', async () => {
			const first = await unitRepo.find({
				alias: 'bch',
				page: 1,
				pageSize: 2
			})
			const second = await unitRepo.find({
				alias: 'bch',
				page: 2,
				pageSize: 2
			})

			expect(idsOf(first)).toEqual([ids.c1bch, ids.c2bch])
			expect(idsOf(second)).toEqual([ids.c1bchSquad])
		})

		it('paginates search results', async () => {
			const units = await unitRepo.find({
				search: 'Ban chi huy',
				page: 2,
				pageSize: 1
			})

			expect(idsOf(units)).toEqual([ids.c2bch])
		})

		it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
			'rejects pageSize %s',
			async (pageSize) => {
				await expectInvalidArgument(
					unitRepo.find({ page: 1, pageSize }),
					/pageSize/
				)
			}
		)

		it.each([0, -2, 1.5, Number.NaN])('rejects page %s', async (page) => {
			await expectInvalidArgument(
				unitRepo.find({ page, pageSize: 3 }),
				/page must/
			)
		})
	})

	describe('relations', () => {
		it('hydrates one level of children', async () => {
			const [company] = await unitRepo.find({
				ids: [ids.c1],
				with: { children: true }
			})

			expect(idsOf(company.children!)).toEqual([ids.c1bch, ids.c1p1])
			expect(company.children![0].children).toBeUndefined()
			expect(company.parent).toBeUndefined()
		})

		it('hydrates the parent', async () => {
			const [platoon] = await unitRepo.find({
				ids: [ids.c2bch],
				with: { parent: true }
			})

			expect(platoon.parent?.id).toBe(ids.c2)
			expect(platoon.children).toBeUndefined()
		})

		it('hydrates both directions', async () => {
			const [company] = await unitRepo.find({
				ids: [ids.c1],
				with: { children: true, parent: true }
			})

			expect(company.parent?.id).toBe(ids.d1)
			expect(company.children).toHaveLength(2)
		})

		it('gives a root unit a null parent and a leaf an empty children list', async () => {
			const [root] = await unitRepo.find({
				ids: [ids.d1],
				with: { parent: true }
			})
			const [leaf] = await unitRepo.find({
				ids: [ids.c2p1],
				with: { children: true }
			})

			expect(root.parent).toBeNull()
			expect(leaf.children).toEqual([])
		})

		it('hydrates grandchildren, each with its parent, when deep', async () => {
			const [company] = await unitRepo.find({
				ids: [ids.c1],
				with: { children: 'deep', parent: true }
			})
			const bch = company.children!.find((c) => c.id === ids.c1bch)!

			expect(idsOf(bch.children!)).toEqual([ids.c1bchSquad])
			expect(bch.children![0].parent?.id).toBe(ids.c1bch)
			expect(bch.parent?.id).toBe(ids.c1)
		})

		it('keeps one row per unit when hydrating', async () => {
			const units = await unitRepo.find({
				with: { children: 'deep', parent: true }
			})

			expect(idsOf(units)).toEqual(idsOf(await unitRepo.find()))
		})
	})
})

describe('unitRepo.findOne', () => {
	describe('lookups', () => {
		it('finds a unit by id', async () => {
			const unit = await unitRepo.findOne({ id: ids.c1 })

			expect(unit?.id).toBe(ids.c1)
			expect(unit?.alias).toBe('c1')
		})

		it('finds a unit by name', async () => {
			const unit = await unitRepo.findOne({ name: 'Ban chi huy C2' })

			expect(unit?.id).toBe(ids.c2bch)
		})

		it('finds a unit by level and parent', async () => {
			const unit = await unitRepo.findOne({
				level: 'squad',
				parentId: ids.c1bch
			})

			expect(unit?.id).toBe(ids.c1bchSquad)
		})

		it('tells duplicated aliases apart by parent', async () => {
			const first = await unitRepo.findOne({
				alias: 'bch',
				parentId: ids.c1
			})
			const second = await unitRepo.findOne({
				alias: 'bch',
				parentId: ids.c2
			})

			expect(first?.id).toBe(ids.c1bch)
			expect(second?.id).toBe(ids.c2bch)
			expect(first?.name).not.toBe(second?.name)
		})

		it('tells duplicated aliases apart by level', async () => {
			const unit = await unitRepo.findOne({
				alias: 'bch',
				level: 'squad'
			})

			expect(unit?.id).toBe(ids.c1bchSquad)
		})

		it('matches the root when parentId is null', async () => {
			const root = await unitRepo.findOne({ parentId: null })

			expect(root?.id).toBe(ids.d1)
		})

		it('matches NULL columns when given null', async () => {
			const unit = await unitRepo.findOne({
				commanderId: null,
				alias: 'p1',
				parentId: ids.c2
			})

			expect(unit?.id).toBe(ids.c2p1)
		})

		it('ignores undefined fields', async () => {
			const unit = await unitRepo.findOne({
				id: ids.c2,
				alias: undefined,
				level: undefined,
				parentId: undefined
			})

			expect(unit?.id).toBe(ids.c2)
		})

		it('combines every provided field with AND', async () => {
			const unit = await unitRepo.findOne({
				id: ids.c1bch,
				alias: 'bch',
				level: 'platoon',
				name: 'Ban chi huy C1',
				parentId: ids.c1
			})

			expect(unit?.id).toBe(ids.c1bch)
		})

		it('returns the lowest id when the filter is ambiguous, deterministically', async () => {
			const results = await Promise.all(
				Array.from({ length: 5 }, () =>
					unitRepo.findOne({ alias: 'bch' })
				)
			)

			expect(results.map((u) => u?.id)).toEqual(Array(5).fill(ids.c1bch))
		})
	})

	describe('no match', () => {
		it('returns undefined for an unknown id', async () => {
			expect(await unitRepo.findOne({ id: 999_999 })).toBeUndefined()
		})

		it('returns undefined for an unknown alias', async () => {
			expect(await unitRepo.findOne({ alias: 'nope' })).toBeUndefined()
		})

		it('returns undefined when fields contradict each other', async () => {
			expect(
				await unitRepo.findOne({ id: ids.c1, alias: 'c2' })
			).toBeUndefined()
		})

		it('returns undefined for an alias that only exists under another parent', async () => {
			expect(
				await unitRepo.findOne({ alias: 'c1', parentId: ids.c2 })
			).toBeUndefined()
		})

		it('does not match a non-root unit when parentId is null', async () => {
			expect(
				await unitRepo.findOne({ alias: 'c1', parentId: null })
			).toBeUndefined()
		})
	})

	describe('relations', () => {
		it('does not hydrate relations by default', async () => {
			const unit = await unitRepo.findOne({ id: ids.c1 })

			expect(unit?.children).toBeUndefined()
			expect(unit?.parent).toBeUndefined()
		})

		it('hydrates children and parent on request', async () => {
			const unit = await unitRepo.findOne(
				{ id: ids.c1 },
				{ with: { children: true, parent: true } }
			)

			expect(unit?.parent?.id).toBe(ids.d1)
			expect(idsOf(unit!.children!)).toEqual([ids.c1bch, ids.c1p1])
		})

		it('hydrates grandchildren when deep', async () => {
			const unit = await unitRepo.findOne(
				{ id: ids.c1 },
				{ with: { children: 'deep' } }
			)
			const bch = unit!.children!.find((c) => c.id === ids.c1bch)!

			expect(idsOf(bch.children!)).toEqual([ids.c1bchSquad])
		})
	})

	describe('invalid filters', () => {
		it('rejects an empty filter', async () => {
			await expectInvalidArgument(
				unitRepo.findOne({}),
				/at least one unit filter field/i
			)
		})

		it('rejects a filter whose fields are all undefined instead of matching any unit', async () => {
			await expectInvalidArgument(
				unitRepo.findOne({ id: undefined, alias: undefined }),
				/at least one unit filter field/i
			)
		})

		it('rejects a field that is not a unit column', async () => {
			await expectInvalidArgument(
				unitRepo.findOne({ children: [] } as never),
				/Unknown unit field: children/
			)
			await expectInvalidArgument(
				unitRepo.findOne({ id: ids.c1, notAField: 1 } as never),
				/Unknown unit field: notAField/
			)
		})

		it('does not treat prototype keys as columns', async () => {
			await expectInvalidArgument(
				unitRepo.findOne({ constructor: 1 } as never),
				/Unknown unit field/
			)
		})
	})

	describe('database errors', () => {
		it('reports an unknown level as an invalid argument, not an internal error', async () => {
			await expectInvalidArgument(
				unitRepo.findOne({ level: 'galaxy' as never }),
				/Invalid unit level name: galaxy/
			)
			await expectInvalidArgument(
				unitRepo.find({ level: 'galaxy' as never }),
				/Invalid unit level name: galaxy/
			)
		})
	})
})

describe('unitRepo.findAncestorChain', () => {
	it('returns the unit and its ancestors, nearest first', async () => {
		const chain = await unitRepo.findAncestorChain(ids.c1bchSquad)

		expect(idsOf(chain)).toEqual([
			ids.c1bchSquad,
			ids.c1bch,
			ids.c1,
			ids.d1
		])
	})

	it('follows the actual parent chain even when aliases repeat', async () => {
		const chain = await unitRepo.findAncestorChain(ids.c2bch)

		expect(idsOf(chain)).toEqual([ids.c2bch, ids.c2, ids.d1])
	})

	it('returns just the root for the root', async () => {
		expect(idsOf(await unitRepo.findAncestorChain(ids.d1))).toEqual([
			ids.d1
		])
	})

	it('returns an empty chain for an unknown unit', async () => {
		expect(await unitRepo.findAncestorChain(999_999)).toEqual([])
	})
})

describe('unitRepo write constraints', () => {
	it('allows the same alias under different parents', async () => {
		const created = await unitRepo.create([
			{
				alias: 'shared-alias',
				name: 'Shared under c1',
				level: 'platoon',
				parentId: ids.c1
			},
			{
				alias: 'shared-alias',
				name: 'Shared under c2',
				level: 'platoon',
				parentId: ids.c2
			}
		])

		expect(created).toHaveLength(2)
		expect(idsOf(await unitRepo.find({ alias: 'shared-alias' }))).toEqual(
			idsOf(created)
		)
	})

	it('rejects the same alias twice under one parent with AlreadyExists', async () => {
		const err = await rejection(
			unitRepo.create([
				{
					alias: 'p1',
					name: 'Another name',
					level: 'platoon',
					parentId: ids.c1
				}
			])
		)

		expect(err).toBeInstanceOf(AppError)
		expect((err as AppError).type).toBe('AlreadyExists')
	})

	it('rejects the same name twice under one parent with AlreadyExists', async () => {
		const err = await rejection(
			unitRepo.create([
				{
					alias: 'another-alias',
					name: 'Trung doi 1 C1',
					level: 'platoon',
					parentId: ids.c1
				}
			])
		)

		expect(err).toBeInstanceOf(AppError)
		expect((err as AppError).type).toBe('AlreadyExists')
	})

	it('updates and deletes the exact unit that was addressed by id', async () => {
		const [created] = await unitRepo.create([
			{
				alias: 'tmp',
				name: 'Temporary',
				level: 'platoon',
				parentId: ids.c2
			}
		])

		await unitRepo.update([
			{ id: created.id, updatePayload: { name: 'Temporary renamed' } }
		])
		expect((await unitRepo.findOne({ id: created.id }))?.name).toBe(
			'Temporary renamed'
		)
		expect((await unitRepo.findOne({ id: ids.c2p1 }))?.name).toBe(
			'Trung doi 1 C2'
		)

		await unitRepo.delete([created])
		expect(await unitRepo.findOne({ id: created.id })).toBeUndefined()
		expect(await unitRepo.findOne({ id: ids.c2 })).toBeDefined()
	})
})
