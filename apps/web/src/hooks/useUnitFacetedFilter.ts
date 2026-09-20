import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EduLevelOptions } from '@/components/data-table/data/data'
import { EhtnicOptions } from '@/data/ethnicities'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import type { Student, Unit } from '@/types'

export interface UseUnitFacetedFiltersParams {
	troopers: Student[]
	unit?: Unit
}

export default function useUnitFacetedFilters({
	troopers,
	unit
}: UseUnitFacetedFiltersParams) {
	const { t } = useTranslation('units')
	const { createFacetedFilter } = useDataTableToolbarConfig()

	const militaryRankOptions = useMemo(() => {
		const set = new Set(troopers.filter((s) => !!s.rank).map((s) => s.rank))
		return Array.from(set).map((rank) => ({ label: rank, value: rank }))
	}, [troopers])

	const unitOptions = useMemo(
		() =>
			(unit?.children ?? []).flatMap((c) => ({
				label: `${c.name} ${c.parent?.name !== undefined ? `- ${c.alias}` : ''}`,
				value: c.name
			})),
		[unit]
	)

	return useMemo(
		() => [
			createFacetedFilter('unit.name', t('filters.unit'), unitOptions),
			createFacetedFilter('rank', t('filters.rank'), militaryRankOptions),
			createFacetedFilter('ethnic', t('filters.ethnic'), EhtnicOptions),
			createFacetedFilter(
				'educationLevel',
				t('filters.educationLevel'),
				EduLevelOptions
			)
		],
		[t, createFacetedFilter, unitOptions, militaryRankOptions]
	)
}
