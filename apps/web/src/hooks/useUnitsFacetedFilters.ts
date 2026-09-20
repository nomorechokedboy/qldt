import type { Unit } from '@/types'
import useDataTableToolbarConfig from './useDataTableToolbarConfig'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
	label: labelProp
}: UseUnitsFacetedFiltersParams) {
	const { t } = useTranslation('units')
	const label = labelProp ?? t('filters.unit')
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
