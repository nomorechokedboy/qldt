export const normalizeKey = (value: string) => value.trim().toLowerCase()

export function buildLabelMap<T, V>(
	items: readonly T[],
	getLabel: (item: T) => string,
	getValue: (item: T) => V
) {
	const map = new Map<string, V>()
	items.forEach((item) =>
		map.set(normalizeKey(getLabel(item)), getValue(item))
	)
	return map
}

export function groupByUnit<T>(
	items: readonly T[],
	getUnitId: (item: T) => number | undefined
) {
	const map = new Map<number, T[]>()
	items.forEach((item) => {
		const unitId = getUnitId(item)
		if (unitId === undefined) return
		const list = map.get(unitId) ?? []
		list.push(item)
		map.set(unitId, list)
	})
	return map
}

// Names aren't unique across units, so name -> id lookups are always scoped
// to a row's own unit.
export function indexNamesByUnit<T>(
	itemsByUnit: Map<number, T[]>,
	getName: (item: T) => string,
	getId: (item: T) => number
) {
	const map = new Map<number, Map<string, number>>()
	itemsByUnit.forEach((items, unitId) => {
		map.set(unitId, buildLabelMap(items, getName, getId))
	})
	return map
}
