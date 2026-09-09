import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyPlatoonTable from '@/components/company-platoon-table'
import CompanySquadTable from '@/components/company-squad-table'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StudentTable from '@/components/student-table'
import z from 'zod'
import useUnitTroopersData from '@/hooks/useUnitTroopersData'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import useActionColumn from '@/hooks/useActionColumn'
import TableSkeleton from '@/components/table-skeleton'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useUnitData from '@/hooks/useUnitData'
import { PermissionTag } from '@/lib/permission-tags'

const companyAliasSearchSchema = z.object({ id: z.number().nonoptional() })

export const Route = createFileRoute('/dai-doi/$companyAlias')({
	component: RouteComponent,
	validateSearch: companyAliasSearchSchema
})

function RouteComponent() {
	const { companyAlias } = Route.useParams()
	const { id } = Route.useSearch()
	const {
		data: troopers = [],
		isLoading: isLoadingStudents,
		refetch: refetchTroopers
	} = useUnitTroopersData({ id })
	const { data: unit } = useUnitData({
		alias: companyAlias,
		level: 'company',
		id
	})
	const filename = `danh-sach-quan-nhan-${companyAlias}`

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
						<TabsTrigger value='platoons'>Trung đội</TabsTrigger>
						<TabsTrigger value='squads'>Tiểu đội</TabsTrigger>
						<TabsTrigger value='facilities'>
							Cơ sở vật chất
						</TabsTrigger>
						<TabsTrigger value='weapons'>
							Vũ khí/trang bị
						</TabsTrigger>
					</TabsList>

					<TabsContent value='platoons'>
						<CompanyPlatoonTable companyAlias={companyAlias} />
					</TabsContent>

					<TabsContent value='squads'>
						<CompanySquadTable companyAlias={companyAlias} />
					</TabsContent>

					<TabsContent value='students'>
						<ProtectedRoute
							requiredPermission={PermissionTag.STUDENTS_READ}
						>
							<StudentTable
								data={troopers}
								isLoading={isLoadingStudents}
								refetch={refetchTroopers}
								columnVisibility={{
									...defaultBirthdayColumnVisibility,
									address: false,
									status: false
								}}
								columns={[
									...battalionStudentColumnsWithoutAction,
									actionColumn
								]}
								facetedFilters={[]}
								placeholder='Chưa có thông tin quân nhân.'
								exportConfig={{
									filename,
									defaultExportValues: {
										unitName:
											unit?.parent?.name?.toUpperCase(),
										underUnitName: unit?.name?.toUpperCase()
									},
									unitRoster: {
										alias: companyAlias,
										level: 'company'
									}
								}}
								onDeleteRows={handleDeleteTroopers}
								onCreateSuccess={refetchTroopers}
								enableCreation
								showRefreshButton
							/>
						</ProtectedRoute>
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitAlias={companyAlias} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitAlias={companyAlias} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
