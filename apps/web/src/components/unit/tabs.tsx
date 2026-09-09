import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import StudentTable from '@/components/student-table'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import type { ColumnDef } from '@tanstack/react-table'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { Student as Trooper, UnitLevel } from '@/types'
import type useUnitFacetedFilters from '@/hooks/useUnitFacetedFilter'

interface UnitTabsProps {
	alias: string
	level: UnitLevel
	unitName?: string
	parentUnitName?: string
	data: Trooper[]
	isLoading: boolean
	refetch: () => Promise<QueryObserverResult<Trooper[], unknown>>
	facetedFilters: ReturnType<typeof useUnitFacetedFilters>
	actionColumn: ColumnDef<Trooper>
	onDeleteRows: (rows: Trooper[]) => void
	onCreateSuccess: () => void
}

export default function UnitTabs({
	alias,
	level,
	unitName,
	parentUnitName,
	data,
	isLoading,
	refetch,
	facetedFilters,
	actionColumn,
	onDeleteRows,
	onCreateSuccess
}: UnitTabsProps) {
	const filename = `danh-sach-quan-nhan-${alias}`

	return (
		<Tabs defaultValue='students'>
			<TabsList>
				<TabsTrigger value='students'>Quân nhân</TabsTrigger>
				<TabsTrigger value='facilities'>Cơ sở vật chất</TabsTrigger>
				<TabsTrigger value='weapons'>Vũ khí/trang bị</TabsTrigger>
			</TabsList>

			<TabsContent value='students'>
				<StudentTable
					data={data}
					isLoading={isLoading}
					refetch={refetch}
					columnVisibility={{
						...defaultBirthdayColumnVisibility,
						address: false,
						status: false
					}}
					columns={[
						...battalionStudentColumnsWithoutAction,
						actionColumn
					]}
					facetedFilters={facetedFilters}
					placeholder='Chưa có thông tin quân nhân.'
					exportConfig={{
						filename,
						defaultExportValues: {
							unitName: parentUnitName?.toUpperCase(),
							underUnitName: unitName?.toUpperCase()
						},
						unitRoster: { alias, level }
					}}
					onDeleteRows={onDeleteRows}
					onCreateSuccess={onCreateSuccess}
					enableCreation
					showRefreshButton
				/>
			</TabsContent>

			<TabsContent value='facilities'>
				<CompanyFacilitiesTab unitAlias={alias} />
			</TabsContent>

			<TabsContent value='weapons'>
				<CompanyWeaponsTab unitAlias={alias} />
			</TabsContent>
		</Tabs>
	)
}
