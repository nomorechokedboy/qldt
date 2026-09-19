import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import {
	ExportUnitRosterExtract,
	GetStudents,
	GetUnit,
	GetUnitStats,
	GetUnitStatsMaterialAssets,
	GetUnitStatsMaterialStocks,
	GetUnitStatsStudents
} from '@/api'

afterEach(() => {
	vi.unstubAllGlobals()
})

// Units are addressed by id everywhere: alias and level repeat across the
// tree (every company owns a "bch" platoon), so they can't identify a unit.
describe('unit endpoints are addressed by id', () => {
	it('GetUnit requests /units/:id and unwraps the unit', async () => {
		const { requests } = mockFetch(() => ({
			body: { data: { id: 7, alias: 'bch', name: 'Ban chi huy' } }
		}))

		const unit = await GetUnit(7)

		expect(requests).toHaveLength(1)
		expect(requests[0].method).toBe('GET')
		expect(requests[0].path).toBe('/units/7')
		expect(unit).toMatchObject({ id: 7, alias: 'bch' })
	})

	it('two units sharing an alias are two distinct requests', async () => {
		const { requests } = mockFetch(({ path }) => ({
			body: { data: { id: Number(path.split('/').pop()), alias: 'bch' } }
		}))

		const [first, second] = await Promise.all([GetUnit(6), GetUnit(16)])

		expect(requests.map((r) => r.path).sort()).toEqual([
			'/units/16',
			'/units/6'
		])
		expect(first).toMatchObject({ id: 6 })
		expect(second).toMatchObject({ id: 16 })
	})

	it.each([
		['GetUnitStats', GetUnitStats, '/units/12/stats'],
		[
			'GetUnitStatsStudents',
			GetUnitStatsStudents,
			'/units/12/stats/students'
		],
		[
			'GetUnitStatsMaterialStocks',
			GetUnitStatsMaterialStocks,
			'/units/12/stats/material-stocks'
		],
		[
			'GetUnitStatsMaterialAssets',
			GetUnitStatsMaterialAssets,
			'/units/12/stats/material-assets'
		]
	])('%s requests %s by unit id', async (_name, call, expectedPath) => {
		const { requests } = mockFetch(() => ({ body: { data: [] } }))

		await call(12)

		expect(requests).toHaveLength(1)
		expect(requests[0].path).toBe(expectedPath)
		expect(requests[0].url.search).toBe('')
	})

	it('surfaces a server error instead of returning empty data', async () => {
		mockFetch(() => ({
			status: 400,
			body: {
				code: 'invalid_argument',
				message: 'Unit not found: 404',
				details: null
			}
		}))

		await expect(GetUnit(404)).rejects.toMatchObject({
			code: 'invalid_argument',
			message: 'Unit not found: 404'
		})
		await expect(GetUnitStats(404)).rejects.toMatchObject({
			code: 'invalid_argument'
		})
	})

	it('surfaces a permission error', async () => {
		mockFetch(() => ({
			status: 403,
			body: { code: 'permission_denied', message: 'no access' }
		}))

		await expect(GetUnitStatsStudents(1)).rejects.toMatchObject({
			code: 'permission_denied'
		})
	})
})

describe('GetStudents unit filter', () => {
	it('filters by unit id', async () => {
		const { requests } = mockFetch(() => ({ body: { data: [] } }))

		await GetStudents({ unitId: 5 })

		expect(requests[0].path).toBe('/students')
		expect(requests[0].url.searchParams.get('unitId')).toBe('5')
	})

	it('no longer sends alias or level to identify a unit', async () => {
		const { requests } = mockFetch(() => ({ body: { data: [] } }))

		await GetStudents({ unitId: 5, politicalOrg: 'cpv' })

		const params = requests[0].url.searchParams
		expect(params.has('unitAlias')).toBe(false)
		expect(params.has('unitLevel')).toBe(false)
		expect(params.get('politicalOrg')).toBe('cpv')
	})

	it('sends no unit filter when none is given', async () => {
		const { requests } = mockFetch(() => ({ body: { data: [] } }))

		await GetStudents()

		expect(requests[0].url.search).toBe('')
	})

	it('returns the students from the response', async () => {
		mockFetch(() => ({
			body: {
				data: [
					{ id: 1, fullName: 'A' },
					{ id: 2, fullName: 'B' }
				]
			}
		}))

		const students = await GetStudents({ unitId: 5 })

		expect(students.map((s) => s.fullName)).toEqual(['A', 'B'])
	})
})

describe('ExportUnitRosterExtract', () => {
	const payload = {
		unitId: 21,
		unitName: 'Dai doi 1',
		underUnitName: 'Tieu doan 1',
		city: 'Dong Nai',
		commanderName: 'A',
		commanderPosition: 'CT',
		commanderRank: '1/',
		reportTitle: 'DANH SACH'
	}

	it('posts the unit id so the server resolves exactly that unit', async () => {
		const { requests } = mockFetch()

		await ExportUnitRosterExtract(payload)

		expect(requests[0].method).toBe('POST')
		expect(requests[0].path).toBe('/students/export-roster')
		expect(requests[0].body).toMatchObject({ unitId: 21 })
	})

	it('does not identify the unit by alias or level', async () => {
		const { requests } = mockFetch()

		await ExportUnitRosterExtract(payload)

		expect(requests[0].body).not.toHaveProperty('unitAlias')
		expect(requests[0].body).not.toHaveProperty('unitLevel')
	})
})
