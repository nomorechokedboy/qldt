import { DataTable } from '@/components/data-table'
import { ExportMaterialAssetsDialog } from '@/components/export-material-assets-dialog'
import { ExportTemplateManager } from '@/components/export-template-manager'
import { LazyImportMaterialAssetsDialog as ImportMaterialAssetsDialog } from '@/components/import-material-assets-dialog-lazy'
import MaterialAssetForm from '@/components/material-asset-form'
import { buildMaterialAssetColumns } from '@/components/material-asset-table/columns'
import { Button } from '@/components/ui/button'
import { materialAssetStatusOptions } from '@/data/material-categories'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import useMaterialAssetsData from '@/hooks/useMaterialAssetsData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useRoomsData from '@/hooks/useRoomsData'
import useStudentData from '@/hooks/useStudents'
import useUnitData from '@/hooks/useUnitData'
import type { MaterialAsset } from '@/types'
import { ArrowDownToLine, Settings, Upload } from 'lucide-react'
import { useState } from 'react'

type CompanyWeaponsTabProps = {
	unitId: number
}

export default function CompanyWeaponsTab({ unitId }: CompanyWeaponsTabProps) {
	const { data: company, refetch: refetchUnit } = useUnitData({ id: unitId })
	const { data: assets, refetch: refetchAssets } = useMaterialAssetsData(
		undefined,
		{ enabled: true }
	)
	const { data: rooms, refetch: refetchRooms } = useRoomsData(
		{},
		{ enabled: true }
	)
	const { data: materialTypes } = useMaterialTypesData({ enabled: true })
	const { data: students } = useStudentData({ unitId })
	const { createSearchConfig, createFacetedFilter } =
		useDataTableToolbarConfig()
	const [importAssetsOpen, setImportAssetsOpen] = useState(false)

	const unitOptions = company ? [company] : []
	const unitIds = unitOptions.map((u) => u.id)
	const companyAssets =
		assets?.filter((a) => unitIds.includes(a.unitId)) ?? []
	const companyRooms = rooms?.filter((r) => unitIds.includes(r.unitId)) ?? []
	const weaponTypes = materialTypes?.filter((t) => t.isSerialized) ?? []

	const handleChanged = () => {
		refetchUnit()
		refetchAssets()
		refetchRooms()
	}

	const searchConfig = [
		createSearchConfig('serialNumber', 'Tìm kiếm theo số sê-ri...')
	]
	const facetedFilters = [
		createFacetedFilter('status', 'Trạng thái', materialAssetStatusOptions)
	]

	return (
		<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					Vũ khí/trang bị của {company?.name}
				</h2>
				{company?.id !== undefined && (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							onClick={() => setImportAssetsOpen(true)}
						>
							<Upload />
							Import
						</Button>
						<MaterialAssetForm
							unitOptions={unitOptions}
							defaultUnitId={company.id}
							roomOptions={companyRooms}
							materialTypeOptions={weaponTypes}
							studentOptions={students ?? []}
							onSuccess={handleChanged}
						/>
					</div>
				)}
			</div>

			<ImportMaterialAssetsDialog
				unitId={unitId}
				isOpen={importAssetsOpen}
				onClose={() => setImportAssetsOpen(false)}
				onSuccess={handleChanged}
			/>

			<DataTable
				placeholder='Đơn vị chưa có vũ khí/trang bị nào'
				columns={buildMaterialAssetColumns(
					companyRooms,
					students ?? [],
					handleChanged
				)}
				data={companyAssets}
				toolbarProps={{
					searchConfig,
					facetedFilters
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
							defaultFilename={`vu-khi-trang-bi-${company?.name ?? ''}`}
							defaultValues={{
								unitName: company?.name,
								underUnitName: company?.parent?.name
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
		</div>
	)
}
