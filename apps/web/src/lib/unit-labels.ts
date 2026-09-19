import type { Unit } from '@/types'

export function buildUnitsById(units: Unit[]): Map<number, Unit> {
	return new Map(units.map((u) => [u.id, u]))
}

// Full ancestor-name chain, nearest first, built by walking the
// embedded one-level `parent` relation through the flat `units` list:
// each entry in that list also carries its own one-level `parent`, so
// looking a parent up by id yields *its* parent in turn - letting us
// walk arbitrarily deep without any backend change.
export function unitAncestorNames(
	unit: { parent?: Pick<Unit, 'id' | 'name'> | null },
	unitsById: Map<number, { parent?: Pick<Unit, 'id' | 'name'> | null }>
): string[] {
	const names: string[] = []
	let current = unit.parent
	while (current) {
		names.push(current.name)
		current = unitsById.get(current.id)?.parent
	}
	return names
}

// "<name> (<ancestor 1>, <ancestor 2>, ...)" - disambiguates units that
// share both their own name and their immediate parent's name (e.g. a
// "Tiểu đội Trinh sát" under "Trung đội Chỉ huy" repeated under every
// company) by including the full ancestor chain instead of just one
// level.
export function unitLabelWithAncestry(
	unit: { name: string; parent?: Pick<Unit, 'id' | 'name'> | null },
	unitsById: Map<number, { parent?: Pick<Unit, 'id' | 'name'> | null }>
): string {
	const ancestry = unitAncestorNames(unit, unitsById)
	return ancestry.length ? `${unit.name} (${ancestry.join(', ')})` : unit.name
}
