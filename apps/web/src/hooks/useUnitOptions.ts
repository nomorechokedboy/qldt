import { useMemo } from 'react'
import useUnitsData from '@/hooks/useUnitsData'
import { unitLevelOrder } from '@/data/unit-levels'
import { buildUnitsById } from '@/lib/unit-labels'
import { buildUnitOptions } from '@/lib/unit-options'
import type { UnitLevel } from '@/types'

export interface UseUnitOptionsParams {
	enabled?: boolean
	// Only list units at this level or larger.
	minLevel?: UnitLevel
}

// The units the caller may see, ready for a unit select. `units` and
// `unitsById` are the full list so callers can filter further and still
// label with the whole ancestry chain via `buildUnitOptions`.
export default function useUnitOptions({
	enabled,
	minLevel
}: UseUnitOptionsParams = {}) {
	const { data, isLoading, isError } = useUnitsData(undefined, { enabled })
	const units = useMemo(() => data ?? [], [data])

	const unitsById = useMemo(() => buildUnitsById(units), [units])
	const options = useMemo(() => {
		const minRank =
			minLevel === undefined ? -1 : unitLevelOrder.indexOf(minLevel)

		return buildUnitOptions(
			units.filter((u) => unitLevelOrder.indexOf(u.level) >= minRank),
			{ unitsById }
		)
	}, [units, unitsById, minLevel])

	return { units, unitsById, options, isLoading, isError }
}
