import { describe, expect, it } from 'vitest'
import { collectDescendantUnitIds } from './unit-filter'
import type { Unit } from '@/types'

const unit = (id: number, level: string, children: Unit[] = []): Unit =>
	({ id, level, children }) as Unit

describe('collectDescendantUnitIds', () => {
	it('includes a unit with no children - the common case of a trooper posted directly to a company', () => {
		const company = unit(2, 'company')

		expect(collectDescendantUnitIds(company)).toEqual([2])
	})

	it('includes the unit itself plus every descendant, not just squad-level leaves', () => {
		const squad = unit(4, 'squad')
		const platoon = unit(3, 'platoon', [squad])
		const company = unit(2, 'company', [platoon])

		expect(collectDescendantUnitIds(company).sort()).toEqual([2, 3, 4])
	})
})
