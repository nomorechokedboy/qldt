import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import UnitTroopersTable from '@/components/student-table/unit-trooper-table'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import type { ColumnDef } from '@tanstack/react-table'
import type { Student as Trooper, UnitLevel } from '@/types'
import type useUnitFacetedFilters from '@/hooks/useUnitFacetedFilter'

interface UnitTabsProps {
	id: number
	alias: string
	level: UnitLevel
	unitName?: string
	parentUnitName?: string
	facetedFilters: ReturnType<typeof useUnitFacetedFilters>
	actionColumn: ColumnDef<Trooper>
	onDeleteRows: (rows: Trooper[]) => void
	onCreateSuccess: () => void
}

export default function UnitTabs({
	id,
	alias,
	level,
	unitName,
	parentUnitName,
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
				<UnitTroopersTable
					params={{ id, unitAlias: alias, unitLevel: level }}
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
						}
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
