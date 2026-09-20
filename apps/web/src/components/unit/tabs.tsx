import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildBattalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import StudentTable from '@/components/student-table'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import type { ColumnDef } from '@tanstack/react-table'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { Student as Trooper, Unit } from '@/types'
import type useUnitFacetedFilters from '@/hooks/useUnitFacetedFilter'

interface UnitTabsProps {
	alias: string
	unitName?: string
	parentUnitName?: string
	data: Trooper[]
	isLoading: boolean
	refetch: () => Promise<QueryObserverResult<Trooper[], unknown>>
	facetedFilters: ReturnType<typeof useUnitFacetedFilters>
	actionColumn: ColumnDef<Trooper>
	onDeleteRows: (rows: Trooper[]) => void
	onCreateSuccess: () => void
	unitsById: Map<number, Unit>
	unitId: number
}

export default function UnitTabs({
	alias,
	unitName,
	parentUnitName,
	data,
	isLoading,
	refetch,
	facetedFilters,
	actionColumn,
	onDeleteRows,
	onCreateSuccess,
	unitsById,
	unitId
}: UnitTabsProps) {
	const { t } = useTranslation('units')
	const filename = `danh-sach-quan-nhan-${alias}`

	return (
		<Tabs defaultValue='students'>
			<TabsList>
				<TabsTrigger value='students'>{t('tabs.students')}</TabsTrigger>
				<TabsTrigger value='facilities'>
					{t('tabs.facilities')}
				</TabsTrigger>
				<TabsTrigger value='weapons'>{t('tabs.weapons')}</TabsTrigger>
			</TabsList>

			<TabsContent value='students'>
				<StudentTable
					data={data}
					isLoading={isLoading}
					refetch={refetch}
					columnVisibility={{
						...defaultBirthdayColumnVisibility,
						address: false,
						status: false,
						'unit.name': false
					}}
					columns={[
						...buildBattalionStudentColumnsWithoutAction(unitsById),
						actionColumn
					]}
					facetedFilters={facetedFilters}
					placeholder={t('tabs.noStudentInfo')}
					exportConfig={{
						filename,
						defaultExportValues: {
							unitName: parentUnitName?.toUpperCase(),
							underUnitName: unitName?.toUpperCase()
						},
						unitRoster: { id: unitId }
					}}
					onDeleteRows={onDeleteRows}
					onCreateSuccess={onCreateSuccess}
					enableCreation
					showRefreshButton
				/>
			</TabsContent>

			<TabsContent value='facilities'>
				<CompanyFacilitiesTab unitId={unitId} />
			</TabsContent>

			<TabsContent value='weapons'>
				<CompanyWeaponsTab unitId={unitId} />
			</TabsContent>
		</Tabs>
	)
}
