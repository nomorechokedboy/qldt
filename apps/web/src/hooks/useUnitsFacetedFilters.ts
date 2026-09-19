import type { Unit } from '@/types'
import useDataTableToolbarConfig from './useDataTableToolbarConfig'
import { useMemo } from 'react'
import { buildUnitsById } from '@/lib/unit-labels'
import { buildUnitOptions } from '@/lib/unit-options'

export interface UseUnitsFacetedFiltersParams {
	key: string
	units: Unit[]
	label?: string
}

export default function useUnitsFacetedFilters({
	key,
	units,
	label = 'Đơn vị'
}: UseUnitsFacetedFiltersParams) {
	const { createFacetedFilter } = useDataTableToolbarConfig()

	const unitsById = useMemo(() => buildUnitsById(units), [units])
	const unitOptions = useMemo(
		() =>
			buildUnitOptions(units, { unitsById }).map((o) => ({
				value: o.value,
				label: o.label
			})),
		[units, unitsById]
	)

	const facetedUnitsFilter = useMemo(
		() => createFacetedFilter(key, label, unitOptions),
		[createFacetedFilter, key, label, unitOptions]
	)
	return facetedUnitsFilter
}
