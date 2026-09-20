import { useTranslation } from 'react-i18next'
import { EduLevelOptions } from '@/components/data-table/data/data'
import { columnsWithoutAction } from '@/components/student-table/columns'
import { SidebarInset } from '@/components/ui/sidebar'
import { EhtnicOptions } from '@/data/ethnicities'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { defaultCompanyTrooperColumnVisibility } from './student-table/default-columns-visibility'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import TableSkeleton from './table-skeleton'
import StudentTable from './student-table'
import useUnitData from '@/hooks/useUnitData'
import useActionColumn from '@/hooks/useActionColumn'
import useUnitTroopersData from '@/hooks/useUnitTroopersData'

type CompanyStudentTableProps = { alias: string; id: number }

export default function CompanyStudentTable({
	alias,
	id
}: CompanyStudentTableProps) {
	const { t } = useTranslation('units')
	const { createFacetedFilter } = useDataTableToolbarConfig()
	const {
		data: students = [],
		isLoading: isLoadingStudents,
		refetch: refetchStudents
	} = useUnitTroopersData({ id })
	const handleFormSuccess = () => {
		refetchStudents()
	}
	const handleDeleteStudents = useOnDeleteStudents(refetchStudents)
	const { data: unit } = useUnitData({ id })
	const filename = `danh-sach-quan-nhan-${alias}`
	const actionColumn = useActionColumn(() => {
		return refetchStudents()
	})

	if (isLoadingStudents) {
		return <TableSkeleton />
	}

	const militaryRankSet = new Set(
		students.filter((s) => !!s.rank).map((s) => s.rank)
	)
	const militaryRankOptions = Array.from(militaryRankSet).map((rank) => ({
		label: rank,
		value: rank
	}))
	const unitOptions = (unit?.children ?? []).map((c) => ({
		label: `${c.name} (${unit?.name})`,
		value: c.name
	}))

	const statusOptions = [
		{ label: t('filters.statusPending'), value: 'pending' },
		{ label: t('filters.statusConfirmed'), value: 'confirmed' }
	]

	const facetedFilters = [
		createFacetedFilter('unit.name', t('filters.unit'), [
			{ label: unit?.name, value: unit?.name },
			...unitOptions
		]),
		createFacetedFilter('rank', t('filters.rank'), militaryRankOptions),
		createFacetedFilter('ethnic', t('filters.ethnic'), EhtnicOptions),
		createFacetedFilter(
			'educationLevel',
			t('filters.educationLevel'),
			EduLevelOptions
		),
		createFacetedFilter('status', t('filters.status'), statusOptions)
	]

	return (
		<SidebarInset>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<div className='flex items-center justify-between space-y-2'>
					<div>
						<h2 className='text-2xl font-bold tracking-tight'>
							{t('company.studentListTitle')}
						</h2>
						<p className='text-muted-foreground'>
							{t('company.studentListSubtitle', {
								name: unit?.name ?? ''
							})}
						</p>
					</div>
				</div>
				<StudentTable
					data={students}
					isLoading={isLoadingStudents}
					refetch={refetchStudents}
					columnVisibility={defaultCompanyTrooperColumnVisibility}
					columns={[...columnsWithoutAction, actionColumn]}
					facetedFilters={facetedFilters}
					placeholder={t('tabs.noStudentInfo')}
					exportConfig={{
						filename,
						defaultExportValues: {
							underUnitName: unit?.name.toUpperCase(),
							unitName: unit?.parent?.name.toUpperCase()
						},
						unitRoster: { id }
					}}
					onDeleteRows={handleDeleteStudents}
					onCreateSuccess={handleFormSuccess}
					enableCreation
					showRefreshButton
				/>
			</div>
		</SidebarInset>
	)
}
