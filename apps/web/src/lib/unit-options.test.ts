import { describe, expect, it } from 'vitest'
import { buildUnitOptions, type UnitOptionSource } from './unit-options'

const unit = (
	id: number,
	name: string,
	level: string,
	parent: { id: number; name: string } | null = null
): UnitOptionSource => ({ id, name, level, parent })

// d1 > c1 > bch, c2 > bch: the platoon name repeats under every company.
const d1 = unit(1, 'Tieu doan 1', 'battalion')
const c1 = unit(2, 'Dai doi 1', 'company', d1)
const c2 = unit(3, 'Dai doi 2', 'company', d1)
const c1bch = unit(4, 'Ban chi huy', 'platoon', c1)
const c2bch = unit(5, 'Ban chi huy', 'platoon', c2)
const all = [c1bch, c1, d1, c2bch, c2]

const labelOf = (options: ReturnType<typeof buildUnitOptions>, id: number) =>
	options.find((o) => o.id === id)?.label

describe('buildUnitOptions', () => {
	it('uses the unit id as the option value', () => {
		const options = buildUnitOptions(all)

		expect(options.map((o) => o.value).sort()).toEqual([
			'1',
			'2',
			'3',
			'4',
			'5'
		])
	})

	it('tells apart units that share a name by their ancestry', () => {
		const options = buildUnitOptions(all)

		expect(labelOf(options, 4)).not.toBe(labelOf(options, 5))
		expect(labelOf(options, 4)).toContain('Dai doi 1')
		expect(labelOf(options, 5)).toContain('Dai doi 2')
	})

	it('lists larger units first', () => {
		const groups = buildUnitOptions(all).map((o) => o.group)

		expect([...new Set(groups)]).toEqual([
			'Tiểu đoàn',
			'Đại đội',
			'Trung đội'
		])
	})

	it('keeps units of the same level together', () => {
		const options = buildUnitOptions(all)

		const companyIdx = options
			.map((o, i) => (o.level === 'company' ? i : -1))
			.filter((i) => i >= 0)
		expect(companyIdx[1] - companyIdx[0]).toBe(1)
	})

	it('labels a subset with the full chain when given the whole tree', () => {
		const options = buildUnitOptions([c1bch], {
			unitsById: new Map(all.map((u) => [u.id, u]))
		})

		expect(options[0].label).toContain('Dai doi 1')
		expect(options[0].label).toContain('Tieu doan 1')
	})

	it('resolves ancestry for a summary that carries no parent', () => {
		const summary: UnitOptionSource = {
			id: c1bch.id,
			name: c1bch.name,
			level: c1bch.level
		}

		const options = buildUnitOptions([summary], {
			unitsById: new Map(all.map((u) => [u.id, u]))
		})

		expect(options[0].label).toContain('Dai doi 1')
	})

	it('falls back to the bare name when nothing is known about the parent', () => {
		const options = buildUnitOptions([
			{ id: 9, name: 'Somewhere', level: 'platoon' }
		])

		expect(options[0].label).toBe('Somewhere')
	})

	it('puts an unknown level last under its own name', () => {
		const options = buildUnitOptions([
			unit(9, 'Odd', 'mystery'),
			unit(1, 'Tieu doan 1', 'battalion')
		])

		expect(options.map((o) => o.id)).toEqual([1, 9])
		expect(options[1].group).toBe('mystery')
	})

	it('returns nothing for no units', () => {
		expect(buildUnitOptions([])).toEqual([])
	})
})
