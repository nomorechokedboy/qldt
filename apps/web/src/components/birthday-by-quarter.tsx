import { buildBattalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useStudentData from '@/hooks/useStudents'
import useUnitsData from '@/hooks/useUnitsData'
import type { Quarter, Student, StudentQueryParams } from '@/types'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getQuarterOptions } from './period-options'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { defaultBirthdayColumnVisibility } from './student-table/default-columns-visibility'
import { getCurrentQuarter } from '@/lib/utils'
import StudentTable from './student-table'
import UnitFacetedFilter, { useFilteredClassIds } from './unit-filter'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'
import { buildUnitsById } from '@/lib/unit-labels'

export default function BirthdayByQuarter() {
	const { t } = useTranslation('stats')
	const quarterOptions = getQuarterOptions()
	const [selectedUnits, setSelectedUnits] = useState<number[]>([])
	const filteredUnitIds = useFilteredClassIds(selectedUnits)
	const [quarter, setQuarter] = useState<Quarter>(
		`Q${getCurrentQuarter()}` as Quarter
	)
	const { data: units = [] } = useUnitsData()
	const battalionStudentColumnsWithoutAction =
		buildBattalionStudentColumnsWithoutAction(buildUnitsById(units))
	const studentQueryParams: StudentQueryParams = {
		birthdayInQuarter: quarter
	}
	const filename = `danh-sach-sinh-nhat-dong-doi-${quarter}`
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
							value={quarter}
							onValueChange={(value) => {
								setQuarter(value as Quarter)
							}}
						>
							<SelectTrigger className='w-[180px]'>
								<SelectValue aria-label={quarter}>
									{t('period.quarter', { quarter: quarter })}
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
						{t('birthday.descriptionQuarter', { quarter })}
					</p>
				</div>
			</div>
			<StudentTable
				data={filterStudents(students)}
				isLoading={isLoading}
				refetch={refetch}
				columnVisibility={defaultBirthdayColumnVisibility}
				columns={battalionStudentColumnsWithoutAction}
				facetedFilters={facetedFilters}
				exportConfig={{ filename }}
				leftSection={
					<UnitFacetedFilter
						level='battalion'
						selectedUnits={selectedUnits}
						onSelectionChange={setSelectedUnits}
						title={t('period.unit')}
					/>
				}
				showRefreshButton
			/>
		</>
	)
}
