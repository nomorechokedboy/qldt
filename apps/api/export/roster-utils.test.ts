import { describe, expect, it } from 'vitest'
import {
	buildRosterRows,
	buildRosterSummary,
	RosterRow,
	RosterStudent,
	RosterUnitNode
} from './roster-utils'

const unit = (
	id: number,
	name: string,
	level: string,
	parentId: number | null = null
): RosterUnitNode => ({ id, name, level, parentId })

const student = (
	fullName: string,
	unitId: number | null | undefined,
	overrides: Partial<RosterStudent> = {}
): RosterStudent => ({
	fullName,
	rank: 'Binh nhat',
	position: 'Chien si',
	enlistmentPeriod: '',
	unitId,
	...overrides
})

// Groups the flat row list into { header name -> member names } so tests can
// state "who sits under which unit" without depending on row indexes.
function membersByHeader(rows: RosterRow[]): Record<string, string[]> {
	const grouped: Record<string, string[]> = {}
	let current = ''
	for (const row of rows) {
		if (row.type === 'header') {
			current = row.name
			grouped[current] = []
		} else {
			grouped[current].push(row.fullName)
		}
	}
	return grouped
}

describe('buildRosterRows', () => {
	// Two companies whose platoons carry identical names: each student must
	// land under the platoon of *their* company.
	const company1 = unit(2, 'Dai doi 1', 'company', 1)
	const company2 = unit(3, 'Dai doi 2', 'company', 1)
	const units = [
		unit(1, 'Tieu doan 1', 'battalion'),
		company1,
		company2,
		unit(4, 'Ban chi huy', 'platoon', 2),
		unit(5, 'Ban chi huy', 'platoon', 3)
	]

	it('places students under the unit they belong to, even when unit names repeat', () => {
		const rows = buildRosterRows(company1, units, [student('In C1', 4)])

		expect(membersByHeader(rows)).toEqual({
			'Dai doi 1': [],
			'Ban chi huy': ['In C1']
		})
	})

	it('prints the position name while ordering by its code', () => {
		const rows = buildRosterRows(company1, units, [
			student('Named', 4, {
				position: 'dai doi truong',
				positionName: 'Đại đội trưởng'
			}),
			student('Unnamed', 4, { position: 'chien si' })
		])

		expect(
			rows.flatMap((r) => (r.type === 'member' ? [r.position] : []))
		).toEqual(['Đại đội trưởng', 'chien si'])
	})

	it('does not include units or students outside the root', () => {
		const rows = buildRosterRows(company1, units, [
			student('In C1', 4),
			student('In C2', 5)
		])

		expect(JSON.stringify(rows)).not.toContain('In C2')
		expect(rows.filter((r) => r.type === 'header')).toHaveLength(2)
	})

	it('keeps the two same-named platoons separate in a wider export', () => {
		const rows = buildRosterRows(units[0], units, [
			student('In C1', 4),
			student('In C2', 5)
		])

		const headers = rows.filter((r) => r.type === 'header')
		expect(headers.map((h) => h.name)).toEqual([
			'Tieu doan 1',
			'Dai doi 1',
			'Ban chi huy',
			'Dai doi 2',
			'Ban chi huy'
		])

		const firstPlatoonAt = rows.findIndex(
			(r) => r.type === 'header' && r.name === 'Ban chi huy'
		)
		const inC1 = rows.findIndex(
			(r) => r.type === 'member' && r.fullName === 'In C1'
		)
		const inC2 = rows.findIndex(
			(r) => r.type === 'member' && r.fullName === 'In C2'
		)
		expect(inC1).toBe(firstPlatoonAt + 1)
		expect(inC2).toBeGreaterThan(inC1)
	})

	it('counts every member of a unit and its descendants in the header', () => {
		const rows = buildRosterRows(units[0], units, [
			student('A', 4),
			student('B', 4),
			student('C', 5),
			student('D', 2)
		])

		const counts = Object.fromEntries(
			rows
				.filter((r) => r.type === 'header')
				.map((h, i) => [`${h.name}#${i}`, h.count])
		)
		expect(counts['Tieu doan 1#0']).toBe(4)
		expect(counts['Dai doi 1#1']).toBe(3)
		expect(counts['Ban chi huy#2']).toBe(2)
		expect(counts['Dai doi 2#3']).toBe(1)
	})

	it('numbers members consecutively from 1', () => {
		const rows = buildRosterRows(units[0], units, [
			student('A', 4),
			student('B', 5),
			student('C', 2)
		])

		expect(
			rows.flatMap((r) => (r.type === 'member' ? [r.stt] : []))
		).toEqual([1, 2, 3])
	})

	it('ignores students without a unit', () => {
		const rows = buildRosterRows(company1, units, [
			student('Nowhere', null),
			student('Also nowhere', undefined)
		])

		expect(rows.some((r) => r.type === 'member')).toBe(false)
	})

	it('ignores students assigned to a unit that is not part of the roster', () => {
		const rows = buildRosterRows(company1, units, [student('Stray', 999)])

		expect(rows.some((r) => r.type === 'member')).toBe(false)
	})

	it('emits only the root header for a unit with nothing under it', () => {
		const rows = buildRosterRows(unit(9, 'Alone', 'platoon', 2), [], [])

		expect(rows).toEqual([{ type: 'header', name: 'Alone', count: 0 }])
	})

	it('orders the commander before regular members', () => {
		const rows = buildRosterRows(company1, units, [
			student('Soldier', 2, { position: 'Chien si' }),
			student('Commander', 2, { position: 'CT', rank: 'Thieu ta' })
		])

		expect(membersByHeader(rows)['Dai doi 1']).toEqual([
			'Commander',
			'Soldier'
		])
	})
})

describe('buildRosterSummary', () => {
	it('is all zeros for no students', () => {
		expect(buildRosterSummary([])).toEqual({
			total: 0,
			sq: 0,
			qncn: 0,
			hsq: 0,
			bs: 0
		})
	})

	it('counts every ranked student in exactly one bucket', () => {
		const summary = buildRosterSummary([
			{ rank: 'Binh nhat', position: 'Chien si' },
			{ rank: 'Ha si', position: 'Chien si' }
		])

		expect(summary.sq + summary.qncn + summary.hsq + summary.bs).toBe(2)
	})

	it('leaves a student without a rank out of every bucket', () => {
		const summary = buildRosterSummary([{ rank: '', position: 'Chien si' }])

		expect(summary.sq + summary.qncn + summary.hsq + summary.bs).toBe(0)
	})
})
