import { buildBattalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import useUnitsData from '@/hooks/useUnitsData'
import type { Month, Student, StudentQueryParams } from '@/types'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getMonthOptions } from './period-options'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { defaultBirthdayColumnVisibility } from './student-table/default-columns-visibility'
import StudentTable from './student-table'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'
import { buildUnitsById } from '@/lib/unit-labels'

export default function BirthdayByMonth() {
	const { t } = useTranslation('stats')
	const monthOptions = getMonthOptions()
	const [month, setMonth] = useState<Month>(dayjs().format('MM') as Month)
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const { data: units = [] } = useUnitsData()
	const battalionStudentColumnsWithoutAction =
		buildBattalionStudentColumnsWithoutAction(buildUnitsById(units))
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const studentQueryParams: StudentQueryParams = {
		birthdayInMonth: month
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
					<div className='flex gap-2'>
						<h2 className='text-2xl font-bold tracking-tight'>
							{t('birthday.heading')}
						</h2>
						<Select
							value={month}
							onValueChange={(value) => {
								setMonth(value as Month)
							}}
						>
							<SelectTrigger className='w-[180px]'>
								<SelectValue aria-label={month}>
									{t('period.month', { month: month })}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{monthOptions.map(({ label, value }) => (
										<SelectItem value={value} key={value}>
											{label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<p className='text-muted-foreground'>
						{t('birthday.descriptionMonth', { month })}
					</p>
				</div>
			</div>
			<StudentTable
				data={filterStudents(students)}
				isLoading={isLoading}
				refetch={refetch}
				columns={battalionStudentColumnsWithoutAction}
				leftSection={
					<UnitFacetedFilter
						level='battalion'
						selectedUnits={selectedUnits}
						onSelectionChange={setSelectedUnits}
						title={t('period.unit')}
					/>
				}
				facetedFilters={facetedFilters}
				exportConfig={{
					filename: `danh-sach-sinh-nhat-thang-${month}`
				}}
				columnVisibility={defaultBirthdayColumnVisibility}
				showRefreshButton={true}
			/>
		</>
	)
}
