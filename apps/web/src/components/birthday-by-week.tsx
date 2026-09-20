import { buildBattalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import useUnitsData from '@/hooks/useUnitsData'
import { defaultBirthdayColumnVisibility } from './student-table/default-columns-visibility'
import { getCurrentWeekNumber } from '@/lib/utils'
import StudentTable from './student-table'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Student, StudentQueryParams } from '@/types'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'
import { buildUnitsById } from '@/lib/unit-labels'

export default function BirthdayByWeek() {
	const { t } = useTranslation('stats')
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const { data: units = [] } = useUnitsData()
	const battalionStudentColumnsWithoutAction =
		buildBattalionStudentColumnsWithoutAction(buildUnitsById(units))
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const studentQueryParams: StudentQueryParams = {
		birthdayInWeek: true
	}
	const {
		data: students = [],
		isLoading,
		refetch
	} = useStudentData(studentQueryParams)
	const weekNumber = getCurrentWeekNumber()
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
						{t('birthday.headingWeek')}
					</h2>
					<p className='text-muted-foreground'>
						{t('birthday.descriptionWeek')}
					</p>
				</div>
			</div>
			<StudentTable
				data={filterStudents(students)}
				isLoading={isLoading}
				refetch={refetch}
				columnVisibility={defaultBirthdayColumnVisibility}
				columns={battalionStudentColumnsWithoutAction}
				leftSection={
					<UnitFacetedFilter
						selectedUnits={selectedUnits}
						onSelectionChange={setSelectedUnits}
					/>
				}
				facetedFilters={facetedFilters}
				exportConfig={{
					filename: `danh-sach-sinh-nhat-dong-doi-tuan-${weekNumber}`
				}}
				showRefreshButton
			/>
		</>
	)
}
