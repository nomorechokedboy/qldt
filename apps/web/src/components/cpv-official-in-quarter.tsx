import { useCallback, useState } from 'react'
import type { Quarter, Student, StudentQueryParams } from '@/types'
import { getCurrentQuarter } from '@/lib/utils'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { defaultCpvOfficialColumnVisibility } from './student-table/default-columns-visibility'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import StudentTable from './student-table/new-student-table'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'

const quarterOptions = [
	{ value: 'Q1', label: 'Quý 1' },
	{ value: 'Q2', label: 'Quý 2' },
	{ value: 'Q3', label: 'Quý 3' },
	{ value: 'Q4', label: 'Quý 4' }
]

export default function CpvOfficialInQuarter() {
	const [quarter, setQuarter] = useState<Quarter>(
		`Q${getCurrentQuarter()}` as Quarter
	)
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const studentQueryParams: StudentQueryParams = {
		cpvOfficialInQuarter: quarter
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
					<div className='flex gap-2'>
						<h2 className='text-2xl font-bold tracking-tight'>
							Danh sách quân nhân chuẩn bị chuyển Đảng chính thức
							trong
						</h2>
						<Select
							value={quarter}
							onValueChange={(value) =>
								setQuarter(value as Quarter)
							}
						>
							<SelectTrigger className='w-[180px]'>
								<SelectValue aria-label={quarter}>
									Quý {quarter}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{quarterOptions.map(({ label, value }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<p className='text-muted-foreground'>
						Đây là danh sách quân nhân chuẩn bị chuyển Đảng chính
						thức trong quý {quarter} của đại đội
					</p>
				</div>
			</div>

			<StudentTable
				params={studentQueryParams}
				filterStudents={filterStudents}
				columns={battalionStudentColumnsWithoutAction}
				facetedFilters={facetedFilters}
				exportConfig={{
					filename: `danh-sach-chuyen-dang-chinh-thuc-${quarter}`
				}}
				columnVisibility={defaultCpvOfficialColumnVisibility}
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
