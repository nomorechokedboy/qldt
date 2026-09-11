import { EduLevelOptions } from '@/components/data-table/data/data'
import { columnsWithoutAction } from '@/components/student-table/columns'
import { SidebarInset } from '@/components/ui/sidebar'
import { EhtnicOptions } from '@/data/ethnicities'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import type { UnitLevel } from '@/types'
import { defaultCompanyTrooperColumnVisibility } from './student-table/default-columns-visibility'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import TableSkeleton from './table-skeleton'
import StudentTable from './student-table'
import useUnitData from '@/hooks/useUnitData'
import useActionColumn from '@/hooks/useActionColumn'
import useUnitTroopersData from '@/hooks/useUnitTroopersData'

type CompanyStudentTableProps = { alias: string; level: UnitLevel; id: number }

export default function CompanyStudentTable({
	alias,
	level,
	id
}: CompanyStudentTableProps) {
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
	const { data: unit } = useUnitData({ alias, level })
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
		{ label: 'Chưa xác nhận', value: 'pending' },
		{ label: 'Đã xác nhận', value: 'confirmed' }
	]

	const facetedFilters = [
		createFacetedFilter('unit.name', 'Đơn vị', [
			{ label: unit?.name, value: unit?.name },
			...unitOptions
		]),
		createFacetedFilter('rank', 'Cấp bậc', militaryRankOptions),
		createFacetedFilter('ethnic', 'Dân tộc', EhtnicOptions),
		createFacetedFilter(
			'educationLevel',
			'Trình độ học vấn',
			EduLevelOptions
		),
		createFacetedFilter('status', 'Trạng thái', statusOptions)
	]

	return (
		<SidebarInset>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<div className='flex items-center justify-between space-y-2'>
					<div>
						<h2 className='text-2xl font-bold tracking-tight'>
							Danh sách quân nhân
						</h2>
						<p className='text-muted-foreground'>
							Đây là danh sách quân nhân của {unit?.name}
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
					placeholder='Chưa có thông tin quân nhân.'
					exportConfig={{
						filename,
						defaultExportValues: {
							underUnitName: unit?.name.toUpperCase(),
							unitName: unit?.parent?.name.toUpperCase()
						}
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
