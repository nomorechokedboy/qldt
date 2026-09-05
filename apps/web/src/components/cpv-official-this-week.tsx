import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import { defaultCpvOfficialColumnVisibility } from './student-table/default-columns-visibility'
import { getCurrentWeekNumber } from '@/lib/utils'
import StudentTable from './student-table/new-student-table'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useCallback, useState } from 'react'
import type { Student, StudentQueryParams } from '@/types'

export default function CpvOfficialThisWeek() {
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const studentQueryParams: StudentQueryParams = {
		isCpvOfficialThisWeek: true
	}
	const { data: students = [] } = useStudentData(studentQueryParams)
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
						Danh sách quân nhân chuẩn bị chuyển Đảng chính thức
						trong tuần
					</h2>
					<p className='text-muted-foreground'>
						Đây là danh sách quân nhân chuẩn bị chuyển Đảng chính
						thức trong tuần của đại đội
					</p>
				</div>
			</div>
			<StudentTable
				params={studentQueryParams}
				filterStudents={filterStudents}
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
