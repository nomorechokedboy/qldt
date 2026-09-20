import { buildBattalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import useUnitsData from '@/hooks/useUnitsData'
import { defaultCpvOfficialColumnVisibility } from './student-table/default-columns-visibility'
import { getCurrentWeekNumber } from '@/lib/utils'
import StudentTable from './student-table'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Student, StudentQueryParams } from '@/types'
import { buildUnitsById } from '@/lib/unit-labels'

export default function CpvOfficialThisWeek() {
	const { t } = useTranslation('stats')
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const { data: units = [] } = useUnitsData()
	const battalionStudentColumnsWithoutAction =
		buildBattalionStudentColumnsWithoutAction(buildUnitsById(units))
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const studentQueryParams: StudentQueryParams = {
		isCpvOfficialThisWeek: true
	}
	const {
		data: students = [],
		isLoading,
		refetch
	} = useStudentData(studentQueryParams)
	const facetedFilters = useStudentFacetedFilters(students)
	const filterStudents = useCallback(
		(all: Student[]) =>
			selectedUnits.length === 0
				? all
				: all.filter(
						(s) => s.unit && filteredUnitIds?.includes(s.unit.id)
					),
		[selectedUnits, filteredUnitIds]
	)

	return (
		<>
			<div className='flex items-center justify-between space-y-2'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>
						{t('cpv.headingWeek')}
					</h2>
					<p className='text-muted-foreground'>
						{t('cpv.descriptionWeek')}
					</p>
				</div>
			</div>
			<StudentTable
				data={filterStudents(students)}
				isLoading={isLoading}
				refetch={refetch}
				columnVisibility={defaultCpvOfficialColumnVisibility}
				columns={battalionStudentColumnsWithoutAction}
				facetedFilters={facetedFilters}
				exportConfig={{
					filename: `danh-sach-chuyen-dang-chinh-thuc-tuan-${getCurrentWeekNumber()}`
				}}
				leftSection={
					<UnitFacetedFilter
						selectedUnits={selectedUnits}
						onSelectionChange={setSelectedUnits}
					/>
				}
				showRefreshButton
			/>
		</>
	)
}
