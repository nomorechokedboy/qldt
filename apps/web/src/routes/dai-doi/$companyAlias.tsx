import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyPlatoonTable from '@/components/company-platoon-table'
import CompanySquadTable from '@/components/company-squad-table'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StudentTable from '@/components/student-table'
import z from 'zod'
import { useTranslation } from 'react-i18next'
import useUnitTroopersData from '@/hooks/useUnitTroopersData'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import useActionColumn from '@/hooks/useActionColumn'
import TableSkeleton from '@/components/table-skeleton'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import { buildBattalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import useUnitData from '@/hooks/useUnitData'
import useUnitsData from '@/hooks/useUnitsData'
import { buildUnitsById } from '@/lib/unit-labels'
import { PermissionTag } from '@/lib/permission-tags'

const companyAliasSearchSchema = z.object({ id: z.number().nonoptional() })

export const Route = createFileRoute('/dai-doi/$companyAlias')({
	component: RouteComponent,
	validateSearch: companyAliasSearchSchema
})

function RouteComponent() {
	const { t } = useTranslation('units')
	const { companyAlias } = Route.useParams()
	const { id } = Route.useSearch()
	const {
		data: troopers = [],
		isLoading: isLoadingStudents,
		refetch: refetchTroopers
	} = useUnitTroopersData({ id })
	const { data: unit } = useUnitData({ id })
	const { data: units = [] } = useUnitsData()
	const unitsById = buildUnitsById(units)
	const battalionStudentColumnsWithoutAction =
		buildBattalionStudentColumnsWithoutAction(unitsById)
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
						<TabsTrigger value='students'>
							{t('tabs.students')}
						</TabsTrigger>
						<TabsTrigger value='platoons'>
							{t('tabs.platoons')}
						</TabsTrigger>
						<TabsTrigger value='squads'>
							{t('tabs.squads')}
						</TabsTrigger>
						<TabsTrigger value='facilities'>
							{t('tabs.facilities')}
						</TabsTrigger>
						<TabsTrigger value='weapons'>
							{t('tabs.weapons')}
						</TabsTrigger>
					</TabsList>

					<TabsContent value='platoons'>
						<CompanyPlatoonTable companyId={id} />
					</TabsContent>

					<TabsContent value='squads'>
						<CompanySquadTable companyId={id} />
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
									status: false,
									'unit.name': false
								}}
								columns={[
									...battalionStudentColumnsWithoutAction,
									actionColumn
								]}
								facetedFilters={[]}
								placeholder={t('tabs.noStudentInfo')}
								exportConfig={{
									filename,
									defaultExportValues: {
										unitName:
											unit?.parent?.name?.toUpperCase(),
										underUnitName: unit?.name?.toUpperCase()
									},
									unitRoster: { id }
								}}
								onDeleteRows={handleDeleteTroopers}
								onCreateSuccess={refetchTroopers}
								enableCreation
								showRefreshButton
							/>
						</ProtectedRoute>
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitId={id} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitId={id} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
