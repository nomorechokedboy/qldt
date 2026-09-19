import { APIError, ErrCode } from 'encore.dev/api'
import { createRequire } from 'node:module'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { StudentParam } from '../schema/student'
import { cleanupTestDbs } from '../test-utils/test-db'
import unitRepo from '../units/repo'
import studentController from './controller'
import studentRepo from './repo'

// Runs the controller through real repos on a real database and asserts only
// on outcomes (which students come back, what the exported document says).
// The export test opens the generated .docx and reads its text, so it keeps
// holding however the controller assembles the rows internally.
vi.mock('../database', async () => ({
	default: await (await import('../test-utils/test-db')).createTestDb()
}))

afterAll(cleanupTestDbs)

// docx-templates ships jszip; borrow it instead of adding a dependency.
const JSZip = createRequire(require.resolve('docx-templates'))('jszip')

async function docxText(buffer: Uint8Array): Promise<string> {
	const zip = await JSZip.loadAsync(buffer)
	const xml: string = await zip.file('word/document.xml').async('string')

	return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

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

// d1 (battalion)
// |- c1 (company) - bch (platoon), p1 (platoon)
// `- c2 (company) - bch (platoon), p1 (platoon)
//
// Every company owns a platoon with the same alias and level - the shape that
// alias/level lookups used to collapse into "the first bch".
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

async function seedStudent(
	fullName: string,
	unitKey: string,
	extra: Partial<StudentParam> = {}
) {
	await studentRepo.create([
		{
			fullName,
			rank: 'Binh nhat',
			position: 'Chien si',
			politicalOrg: 'hcyu',
			unitId: ids[unitKey],
			...extra
		}
	])
}

const namesOf = (students: { fullName: string | null }[]) =>
	students.map((s) => s.fullName).sort()

beforeAll(async () => {
	await seedUnit('d1', 'd1', 'Tieu doan 1', 'battalion')
	await seedUnit('c1', 'c1', 'Dai doi 1', 'company', 'd1')
	await seedUnit('c2', 'c2', 'Dai doi 2', 'company', 'd1')
	for (const c of ['c1', 'c2']) {
		await seedUnit(`${c}bch`, 'bch', `Ban chi huy ${c}`, 'platoon', c)
		await seedUnit(`${c}p1`, 'p1', `Trung doi 1 ${c}`, 'platoon', c)
	}

	await seedStudent('Alpha C1Bch', 'c1bch', { politicalOrg: 'cpv' })
	await seedStudent('Bravo C1Bch', 'c1bch')
	await seedStudent('Charlie C1P1', 'c1p1')
	await seedStudent('Delta C2Bch', 'c2bch', { politicalOrg: 'cpv' })
	await seedStudent('Echo C2Bch', 'c2bch')
	await seedStudent('Foxtrot C2P1', 'c2p1')
	await seedStudent('Golf C1Direct', 'c1')
})

describe('studentController.find by unit', () => {
	it('returns a units own students and those of every descendant', async () => {
		const students = await studentController.find(
			{ unitId: ids.c1 },
			allUnitIds()
		)

		expect(namesOf(students)).toEqual([
			'Alpha C1Bch',
			'Bravo C1Bch',
			'Charlie C1P1',
			'Golf C1Direct'
		])
	})

	it('covers the whole subtree when asked for the root', async () => {
		const students = await studentController.find(
			{ unitId: ids.d1 },
			allUnitIds()
		)

		expect(students).toHaveLength(7)
	})

	it('keeps same-alias units apart: each bch platoon yields only its own students', async () => {
		const first = await studentController.find(
			{ unitId: ids.c1bch },
			allUnitIds()
		)
		const second = await studentController.find(
			{ unitId: ids.c2bch },
			allUnitIds()
		)

		expect(namesOf(first)).toEqual(['Alpha C1Bch', 'Bravo C1Bch'])
		expect(namesOf(second)).toEqual(['Delta C2Bch', 'Echo C2Bch'])
	})

	it('combines the unit with other filters', async () => {
		const students = await studentController.find(
			{ unitId: ids.c1, politicalOrg: 'cpv' },
			allUnitIds()
		)

		expect(namesOf(students)).toEqual(['Alpha C1Bch'])
	})

	it('returns an empty list for a unit without students', async () => {
		await seedUnit('empty', 'e1', 'Empty platoon', 'platoon', 'c1')

		expect(
			await studentController.find({ unitId: ids.empty }, allUnitIds())
		).toEqual([])
	})

	it('reports an unknown unit as not_found', async () => {
		await expectApiError(
			studentController.find({ unitId: 999999 }, allUnitIds()),
			ErrCode.NotFound
		)
	})

	it('refuses when any unit in the subtree is outside the callers scope', async () => {
		await expectApiError(
			studentController.find(
				{ unitId: ids.c1 },
				[ids.c1, ids.c1bch] // c1p1 is missing
			),
			ErrCode.PermissionDenied
		)
	})

	it('allows a unit whose whole subtree is in scope', async () => {
		const students = await studentController.find({ unitId: ids.c1bch }, [
			ids.c1bch
		])

		expect(namesOf(students)).toEqual(['Alpha C1Bch', 'Bravo C1Bch'])
	})
})

describe('studentController.find outside the callers scope', () => {
	it('refuses to list another companys students', async () => {
		await expectApiError(
			studentController.find({ unitId: ids.c2 }, [
				ids.c1,
				ids.c1bch,
				ids.c1p1
			]),
			ErrCode.PermissionDenied
		)
	})
})

describe('studentController.find without a unit', () => {
	it('is limited to the units the caller may see', async () => {
		const students = await studentController.find({}, [ids.c2bch, ids.c2p1])

		expect(namesOf(students)).toEqual([
			'Delta C2Bch',
			'Echo C2Bch',
			'Foxtrot C2P1'
		])
	})
})

describe('studentController.handleExportUnitRosterExtract', () => {
	const request = (unitId: number) => ({
		unitId,
		unitName: 'Unit name',
		underUnitName: 'Under unit',
		city: 'Ha Noi',
		commanderName: 'Commander',
		commanderPosition: 'CT',
		commanderRank: '1/',
		date: '2026-01-15',
		reportTitle: 'Roster'
	})

	async function exportedText(unitId: number) {
		return docxText(
			await studentController.handleExportUnitRosterExtract(
				request(unitId)
			)
		)
	}

	it('lists every student of the unit and its descendants', async () => {
		const text = await exportedText(ids.c1)

		for (const name of [
			'Alpha C1Bch',
			'Bravo C1Bch',
			'Charlie C1P1',
			'Golf C1Direct'
		]) {
			expect(text).toContain(name)
		}
	})

	it('never leaks another units students into the export', async () => {
		const text = await exportedText(ids.c1)

		for (const name of ['Delta C2Bch', 'Echo C2Bch', 'Foxtrot C2P1']) {
			expect(text).not.toContain(name)
		}
	})

	it('exports each company its own bch platoon, not the first one with that alias', async () => {
		const c1 = await exportedText(ids.c1)
		const c2 = await exportedText(ids.c2)

		expect(c1).toContain('Alpha C1Bch')
		expect(c1).not.toContain('Delta C2Bch')
		expect(c2).toContain('Delta C2Bch')
		expect(c2).toContain('Echo C2Bch')
		expect(c2).not.toContain('Alpha C1Bch')
		expect(c2).not.toContain('Bravo C1Bch')
	})

	it('exports a single platoon on its own even though its alias repeats elsewhere', async () => {
		const text = await exportedText(ids.c2bch)

		expect(text).toContain('Delta C2Bch')
		expect(text).toContain('Echo C2Bch')
		expect(text).not.toContain('Alpha C1Bch')
		expect(text).not.toContain('Foxtrot C2P1')
	})

	it('prints each student exactly once in a battalion-wide export', async () => {
		const text = await exportedText(ids.d1)

		for (const name of [
			'Alpha C1Bch',
			'Bravo C1Bch',
			'Charlie C1P1',
			'Delta C2Bch',
			'Echo C2Bch',
			'Foxtrot C2P1',
			'Golf C1Direct'
		]) {
			expect(text.split(name)).toHaveLength(2)
		}
	})

	it('still produces a document for a unit with no students', async () => {
		const text = await exportedText(ids.empty)

		expect(text).toContain('Roster')
	})

	it('reports an unknown unit as not_found', async () => {
		await expectApiError(
			studentController.handleExportUnitRosterExtract(request(999999)),
			ErrCode.NotFound
		)
	})
})

describe('studentController.handleExportStudentDataDynamic', () => {
	const request = (templateId?: number) => ({
		city: 'Ha Noi',
		commanderName: 'Commander',
		commanderPosition: 'CT',
		commanderRank: '1/',
		data: [{ fullName: 'Alpha C1Bch' }],
		date: '2026-01-15',
		reportTitle: 'Roster',
		underUnitName: 'Under unit',
		unitName: 'Unit name',
		templateId
	})

	it('renders the default template when no custom template is chosen', async () => {
		const text = await docxText(
			await studentController.handleExportStudentDataDynamic(request())
		)

		expect(text).toContain('Alpha C1Bch')
	})

	it('reports an unknown custom template as not_found', async () => {
		await expectApiError(
			studentController.handleExportStudentDataDynamic(request(999999)),
			ErrCode.NotFound
		)
	})
})

// What the authz middleware computes for the leader of company 1: the unit
// itself and everything below it.
describe('studentController.create scope', () => {
	const c1Scope = () => [ids.c1, ids.c1bch, ids.c1p1]

	const newStudent = (fullName: string, unitId: number): StudentParam => ({
		fullName,
		rank: 'Binh nhat',
		position: 'Chien si',
		politicalOrg: 'hcyu',
		unitId,
		birthPlaceProvinceCode: '11',
		birthPlaceWardCode: '267',
		addressProvinceCode: '11',
		addressWardCode: '267'
	})

	const stored = async (fullName: string) =>
		(await studentRepo.find({ unitIds: allUnitIds() })).filter(
			(s) => s.fullName === fullName
		)

	it('creates students in the callers own unit and its descendants', async () => {
		const created = await studentController.create(
			[
				newStudent('Hotel Own', ids.c1),
				newStudent('India Child', ids.c1p1)
			],
			c1Scope()
		)

		expect(created).toHaveLength(2)
		expect(await stored('Hotel Own')).toHaveLength(1)
		expect(await stored('India Child')).toHaveLength(1)
	})

	it('rejects a student addressed to another company and stores nothing', async () => {
		await expectApiError(
			studentController.create(
				[
					newStudent('Juliet Own', ids.c1),
					newStudent('Kilo Foreign', ids.c2p1)
				],
				c1Scope()
			),
			ErrCode.PermissionDenied
		)

		expect(await stored('Juliet Own')).toHaveLength(0)
		expect(await stored('Kilo Foreign')).toHaveLength(0)
	})

	it('rejects a student without a unit', async () => {
		await expectApiError(
			studentController.create(
				[{ ...newStudent('Lima Nowhere', ids.c1), unitId: undefined }],
				c1Scope()
			),
			ErrCode.InvalidArgument
		)
	})

	it('does not let an update move a student into another company', async () => {
		const [own] = await studentController.create(
			[newStudent('Mike Mover', ids.c1)],
			c1Scope()
		)

		await expectApiError(
			studentController.update([{ ...own, unitId: ids.c2 }], c1Scope()),
			ErrCode.PermissionDenied
		)
		expect((await stored('Mike Mover'))[0].unitId).toBe(ids.c1)
	})
})
