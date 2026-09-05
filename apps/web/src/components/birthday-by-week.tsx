import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import { defaultBirthdayColumnVisibility } from './student-table/default-columns-visibility'
import { getCurrentWeekNumber } from '@/lib/utils'
import StudentTable from './student-table/new-student-table'
import { useCallback, useState } from 'react'
import type { Student, StudentQueryParams } from '@/types'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'

export default function BirthdayByWeek() {
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const studentQueryParams: StudentQueryParams = {
		birthdayInWeek: true
	}
	const { data: students = [] } = useStudentData(studentQueryParams)
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
						Danh sách quân nhân có sinh nhật trong tuần
					</h2>
					<p className='text-muted-foreground'>
						Đây là danh sách quân nhân có sinh nhật trong tuần của
						đại đội
					</p>
				</div>
			</div>
			<StudentTable
				params={studentQueryParams}
				filterStudents={filterStudents}
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
