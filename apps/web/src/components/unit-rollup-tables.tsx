import { DataTable } from '@/components/data-table'
import { ExportMaterialAssetsDialog } from '@/components/export-material-assets-dialog'
import { ExportMaterialStocksDialog } from '@/components/export-material-stocks-dialog'
import { ExportTemplateManager } from '@/components/export-template-manager'
import { buildMaterialAssetColumns } from '@/components/material-asset-table/columns'
import { buildMaterialStockColumns } from '@/components/material-stock-table/columns'
import StudentTable from '@/components/student-table'
import { buildReadOnlyBattalionStudentColumns } from '@/components/student-table/columns'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import TableSkeleton from '@/components/table-skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	materialAssetStatusOptions,
	materialConditionOptions
} from '@/data/material-categories'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { useStudentFacetedFilters } from '@/hooks/useStudentFacetedFilters'
import useUnitStatsMaterialAssets from '@/hooks/useUnitStatsMaterialAssets'
import useUnitStatsMaterialStocks from '@/hooks/useUnitStatsMaterialStocks'
import useUnitStatsStudents from '@/hooks/useUnitStatsStudents'
import type { MaterialAsset, MaterialStock, Unit } from '@/types'
import { ArrowDownToLine, Settings } from 'lucide-react'

// The rollup tables only show, so the per-row actions are left out.
const stockColumns = buildMaterialStockColumns([]).filter(
	(c) => c.id !== 'actions'
)
const assetColumns = buildMaterialAssetColumns([], []).filter(
	(c) => c.id !== 'actions'
)

const uniqueOptions = (values: (string | undefined)[]) =>
	Array.from(new Set(values.filter((v): v is string => !!v))).map(
		(value) => ({ label: value, value })
	)

interface UnitRollupTablesProps {
	unitId: number
	unit?: Unit
	unitsById: Map<number, Unit>
}

// The people, living facilities and equipment of a unit and everything under
// it, for looking up and exporting.
export default function UnitRollupTables({
	unitId,
	unit,
	unitsById
}: UnitRollupTablesProps) {
	const {
		data: students,
		isLoading: isLoadingStudents,
		refetch: refetchStudents
	} = useUnitStatsStudents(unitId)
	const {
		data: stocks,
		isLoading: isLoadingStocks,
		refetch: refetchStocks
	} = useUnitStatsMaterialStocks(unitId)
	const {
		data: assets,
		isLoading: isLoadingAssets,
		refetch: refetchAssets
	} = useUnitStatsMaterialAssets(unitId)
	const studentFacetedFilters = useStudentFacetedFilters(students ?? [])
	const { createSearchConfig, createFacetedFilter } =
		useDataTableToolbarConfig()

	const studentColumns = buildReadOnlyBattalionStudentColumns(unitsById)
	const unitName = unit?.name
	const parentName = unit?.parent?.name

	return (
		<Tabs defaultValue='students'>
			<TabsList>
				<TabsTrigger value='students'>Quân nhân</TabsTrigger>
				<TabsTrigger value='material-stocks'>
					Cơ sở vật chất
				</TabsTrigger>
				<TabsTrigger value='material-assets'>
					Vũ khí/trang bị
				</TabsTrigger>
			</TabsList>

			<TabsContent value='students'>
				<StudentTable
					readOnly
					data={students ?? []}
					isLoading={isLoadingStudents}
					refetch={refetchStudents}
					columns={studentColumns}
					columnVisibility={defaultBirthdayColumnVisibility}
					facetedFilters={studentFacetedFilters}
					placeholder='Không có quân nhân nào'
					exportConfig={{
						filename: `quan-nhan-${unitName ?? ''}`,
						defaultExportValues: {
							unitName: parentName?.toUpperCase(),
							underUnitName: unitName?.toUpperCase()
						},
						unitRoster: { id: unitId }
					}}
				/>
			</TabsContent>

			<TabsContent value='material-stocks'>
				{isLoadingStocks ? (
					<TableSkeleton />
				) : (
					<DataTable
						placeholder='Không có vật tư sinh hoạt nào'
						columns={stockColumns}
						data={stocks ?? []}
						onRefresh={() => refetchStocks()}
						toolbarProps={{
							searchConfig: [
								createSearchConfig(
									'materialType',
									'Tìm kiếm theo loại vật tư...'
								)
							],
							facetedFilters: [
								createFacetedFilter(
									'unit',
									'Đơn vị',
									uniqueOptions(
										(stocks ?? []).map((s) => s.unit?.name)
									)
								),
								createFacetedFilter(
									'materialType',
									'Loại vật tư',
									uniqueOptions(
										(stocks ?? []).map(
											(s) => s.materialType?.name
										)
									)
								),
								createFacetedFilter(
									'condition',
									'Tình trạng',
									materialConditionOptions
								)
							]
						}}
						withDynamicColsData={false}
						renderToolbarActions={({ exportHook }) => (
							<>
								<ExportTemplateManager resourceType='material_stocks'>
									<Button variant='outline'>
										<Settings />
										Quản lý mẫu
									</Button>
								</ExportTemplateManager>
								<ExportMaterialStocksDialog
									data={
										exportHook.exportableData
											.data as unknown as MaterialStock[]
									}
									defaultFilename={`vat-tu-sinh-hoat-${unitName ?? ''}`}
									defaultValues={{
										unitName,
										underUnitName: parentName
									}}
								>
									<Button>
										<ArrowDownToLine />
										Xuất file
									</Button>
								</ExportMaterialStocksDialog>
							</>
						)}
					/>
				)}
			</TabsContent>

			<TabsContent value='material-assets'>
				{isLoadingAssets ? (
					<TableSkeleton />
				) : (
					<DataTable
						placeholder='Không có vũ khí/trang bị nào'
						columns={assetColumns}
						data={assets ?? []}
						onRefresh={() => refetchAssets()}
						toolbarProps={{
							searchConfig: [
								createSearchConfig(
									'serialNumber',
									'Tìm kiếm theo số sê-ri...'
								)
							],
							facetedFilters: [
								createFacetedFilter(
									'materialType',
									'Loại khí tài',
									uniqueOptions(
										(assets ?? []).map(
											(a) => a.materialType?.name
										)
									)
								),
								createFacetedFilter(
									'condition',
									'Tình trạng',
									materialConditionOptions
								),
								createFacetedFilter(
									'status',
									'Trạng thái',
									materialAssetStatusOptions
								)
							]
						}}
						withDynamicColsData={false}
						renderToolbarActions={({ exportHook }) => (
							<>
								<ExportTemplateManager resourceType='material_assets'>
									<Button variant='outline'>
										<Settings />
										Quản lý mẫu
									</Button>
								</ExportTemplateManager>
								<ExportMaterialAssetsDialog
									data={
										exportHook.exportableData
											.data as unknown as MaterialAsset[]
									}
									defaultFilename={`vu-khi-trang-bi-${unitName ?? ''}`}
									defaultValues={{
										unitName,
										underUnitName: parentName
									}}
								>
									<Button>
										<ArrowDownToLine />
										Xuất file
									</Button>
								</ExportMaterialAssetsDialog>
							</>
						)}
					/>
				)}
			</TabsContent>
		</Tabs>
	)
}
