import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import { unitLabelWithAncestry } from '@/lib/unit-labels'
import type { Unit, UnitLevel } from '@/types'

type UnitParent = Pick<Unit, 'id' | 'name'> | null

// Anything unit-shaped: a full Unit, or a summary that has no parent
// (e.g. the transfer destination list).
export interface UnitOptionSource {
	id: number
	name: string
	level: string
	parent?: UnitParent
}

export interface UnitOption {
	id: number
	// String(id): the value every unit select stores and submits.
	value: string
	label: string
	level: string
	// Level heading the option is listed under.
	group: string
}

export interface BuildUnitOptionsParams {
	// Where ancestors are looked up when labelling. Defaults to the units
	// being listed; pass the full unit list when listing only a subset so
	// labels still show the whole chain.
	unitsById?: Map<number, { parent?: UnitParent }>
}

function levelRank(level: string) {
	return unitLevelOrder.indexOf(level as UnitLevel)
}

// Largest level first so the list reads top-down, keeping the incoming
// order within a level.
export function buildUnitOptions(
	units: UnitOptionSource[],
	{ unitsById }: BuildUnitOptionsParams = {}
): UnitOption[] {
	const lookup = unitsById ?? new Map(units.map((u) => [u.id, u]))

	return units
		.map((u) => ({
			id: u.id,
			value: String(u.id),
			// A summary without its own parent still gets the chain when the
			// full unit is known.
			label: unitLabelWithAncestry(
				{
					name: u.name,
					parent:
						u.parent !== undefined
							? u.parent
							: lookup.get(u.id)?.parent
				},
				lookup
			),
			level: u.level,
			group: unitLevelLabels[u.level as UnitLevel] ?? u.level
		}))
		.sort((a, b) => levelRank(b.level) - levelRank(a.level))
}
