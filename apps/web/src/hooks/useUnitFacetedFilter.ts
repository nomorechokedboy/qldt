import { useMemo } from 'react'
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
			createFacetedFilter('unit.name', 'Đơn vị', unitOptions),
			createFacetedFilter('rank', 'Cấp bậc', militaryRankOptions),
			createFacetedFilter('ethnic', 'Dân tộc', EhtnicOptions),
			createFacetedFilter(
				'educationLevel',
				'Trình độ học vấn',
				EduLevelOptions
			)
		],
		[createFacetedFilter, unitOptions, militaryRankOptions]
	)
}
