import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UnitTroopersTable from '@/components/student-table/unit-trooper-table'
import z from 'zod'
import useUnitTroopersData from '@/hooks/useUnitTroopersData'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import useActionColumn from '@/hooks/useActionColumn'
import TableSkeleton from '@/components/table-skeleton'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useUnitData from '@/hooks/useUnitData'

const plattonAliasSearchSchema = z.object({ id: z.number().nonoptional() })

export const Route = createFileRoute('/trung-doi/$platoonAlias')({
	component: RouteComponent,
	validateSearch: plattonAliasSearchSchema
})

function RouteComponent() {
	const { platoonAlias } = Route.useParams()
	const { id } = Route.useSearch()
	const {
		data: troopers = [],
		isLoading: isLoadingStudents,
		refetch: refetchTroopers
	} = useUnitTroopersData({ id })
	const { data: unit } = useUnitData({
		alias: platoonAlias,
		level: 'platoon',
		id
	})
	const filename = `danh-sach-quan-nhan-${platoonAlias}`

	// const facetedFilters = useUnitFacetedFilters({ troopers, unit })
	const handleDeleteTroopers = useOnDeleteStudents(refetchTroopers)
	const actionColumn = useActionColumn(() => refetchTroopers())

	if (isLoadingStudents) {
		return <TableSkeleton />
	}

	return (
		<ProtectedRoute>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<Tabs defaultValue='students'>
					<TabsList>
						<TabsTrigger value='students'>Quân nhân</TabsTrigger>
						<TabsTrigger value='facilities'>
							Cơ sở vật chất
						</TabsTrigger>
						<TabsTrigger value='weapons'>
							Vũ khí/trang bị
						</TabsTrigger>
					</TabsList>

					<TabsContent value='students'>
						<UnitTroopersTable
							params={{ id }}
							columnVisibility={{
								...defaultBirthdayColumnVisibility,
								address: false,
								status: false
							}}
							columns={[
								...battalionStudentColumnsWithoutAction,
								actionColumn
							]}
							// facetedFilters={facetedFilters}
							placeholder='Chưa có thông tin quân nhân.'
							exportConfig={{
								filename,
								defaultExportValues: {
									unitName: unit?.parent?.name?.toUpperCase(),
									underUnitName: unit?.name?.toUpperCase()
								}
							}}
							onDeleteRows={handleDeleteTroopers}
							onCreateSuccess={refetchTroopers}
							enableCreation
							showRefreshButton
						/>
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitAlias={platoonAlias} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitAlias={platoonAlias} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
