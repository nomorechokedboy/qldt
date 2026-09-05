import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import useUnitsData from '@/hooks/useUnitsData'
import { EduLevelOptions } from '@/components/data-table/data/data'
import { EhtnicOptions } from '@/data/ethnicities'
import type { Student, Unit } from '@/types'

function collectSquadOptions(
	unit: Unit,
	prefix = ''
): { label: string; value: string }[] {
	if (unit.level === 'squad') {
		const label = prefix ? `${unit.name} - ${prefix}` : unit.name
		return [{ label, value: label }]
	}
	return (unit.children ?? []).flatMap((child) =>
		collectSquadOptions(child, unit.alias)
	)
}

export function useStudentFacetedFilters(students: Student[]) {
	const { data: units = [] } = useUnitsData({ level: 'battalion' })
	const { createFacetedFilter } = useDataTableToolbarConfig()

	// Military Rank Options
	const militaryRankSet = new Set(
		students.filter((s) => !!s.rank).map((s) => s.rank)
	)
	const militaryRankOptions = Array.from(militaryRankSet).map((rank) => ({
		label: rank,
		value: rank
	}))

	// Class Options
	const classOptions = units.flatMap((u) => collectSquadOptions(u))

	// Previous Unit Options
	const previousUnitSet = new Set(
		students.filter((s) => !!s.previousUnit).map((s) => s.previousUnit)
	)
	const previousUnitOptions = Array.from(previousUnitSet).map((pu) => ({
		label: pu,
		value: pu
	}))

	return [
		createFacetedFilter('class.name', 'Tiểu đội', classOptions),
		createFacetedFilter('rank', 'Cấp bậc', militaryRankOptions),
		createFacetedFilter('previousUnit', 'Đơn vị cũ', previousUnitOptions),
		createFacetedFilter('ethnic', 'Dân tộc', EhtnicOptions),
		createFacetedFilter(
			'educationLevel',
			'Trình độ học vấn',
			EduLevelOptions
		)
	]
}
