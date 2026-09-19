import { normalizeKey } from './lookups'

export type FailRow = (message: string) => void

export const isFilled = (value: unknown): value is string =>
	typeof value === 'string' && value.trim() !== ''

export function resolveRequired<V>(
	value: unknown,
	map: Map<string, V>,
	messages: { missing: string; notFound: (value: string) => string },
	fail: FailRow
): V | undefined {
	if (!isFilled(value)) {
		fail(messages.missing)
		return undefined
	}
	const match = map.get(normalizeKey(value))
	if (match === undefined) fail(messages.notFound(value))
	return match
}

export function resolveOptional<V>(
	value: unknown,
	map: Map<string, V>,
	notFound: (value: string) => string,
	fail: FailRow
): V | undefined {
	if (!isFilled(value)) return undefined
	const match = map.get(normalizeKey(value))
	if (match === undefined) fail(notFound(value))
	return match
}

// Looks a name up inside the row's own unit, so it can only resolve once the
// unit itself resolved.
export function resolveInUnit(
	value: unknown,
	unitId: number | undefined,
	mapByUnit: Map<number, Map<string, number>>,
	messages: { noUnit: string; notFound: (value: string) => string },
	fail: FailRow
): number | undefined {
	if (!isFilled(value)) return undefined
	if (unitId === undefined) {
		fail(messages.noUnit)
		return undefined
	}
	const id = mapByUnit.get(unitId)?.get(normalizeKey(value))
	if (id === undefined) fail(messages.notFound(value))
	return id
}
