import { describe, expect, it } from 'vitest'
import { collectUnitScope } from './use-unit-troopers'

const unit = (id: number, parentId?: number) => ({
	id,
	parent: parentId === undefined ? null : { id: parentId }
})

describe('collectUnitScope', () => {
	const units = [
		unit(1),
		unit(2, 1),
		unit(3, 1),
		unit(4, 2),
		unit(5, 4),
		unit(6) // an unrelated tree
	]

	it('covers the unit and everything beneath it, at any depth', () => {
		expect([...collectUnitScope(units, 1)].sort()).toEqual([1, 2, 3, 4, 5])
		expect([...collectUnitScope(units, 2)].sort()).toEqual([2, 4, 5])
	})

	it('is just the unit itself when nothing sits beneath it', () => {
		expect([...collectUnitScope(units, 5)]).toEqual([5])
	})

	it('still includes a unit that is not in the list', () => {
		expect([...collectUnitScope(units, 99)]).toEqual([99])
	})
})
