import MaterialAssetForm from '@/components/material-asset-form'
import { buildMaterialAssetColumns } from '@/components/material-asset-table/columns'
import { DataTable } from '@/components/data-table'
import useUnitData from '@/hooks/useUnitData'
import useMaterialAssetsData from '@/hooks/useMaterialAssetsData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useStudentData from '@/hooks/useStudents'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { materialAssetStatusOptions } from '@/data/material-categories'

type CompanyWeaponsTabProps = {
	unitAlias: string
}

export default function CompanyWeaponsTab({
	unitAlias
}: CompanyWeaponsTabProps) {
	const { data: company, refetch: refetchUnit } = useUnitData({
		alias: unitAlias
	})
	const { data: assets, refetch: refetchAssets } = useMaterialAssetsData(
		undefined,
		{ enabled: true }
	)
	const { data: materialTypes } = useMaterialTypesData({ enabled: true })
	const { data: students } = useStudentData({
		unitAlias,
		unitLevel: company?.level
	})
	const { createSearchConfig, createFacetedFilter } =
		useDataTableToolbarConfig()

	const unitOptions = company ? [company] : []
	const unitIds = unitOptions.map((u) => u.id)
	const companyAssets =
		assets?.filter((a) => unitIds.includes(a.unitId)) ?? []
	const weaponTypes = materialTypes?.filter((t) => t.isSerialized) ?? []

	const handleChanged = () => {
		refetchUnit()
		refetchAssets()
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
					<MaterialAssetForm
						unitOptions={unitOptions}
						defaultUnitId={company.id}
						materialTypeOptions={weaponTypes}
						studentOptions={students ?? []}
						onSuccess={handleChanged}
					/>
				)}
			</div>

			<DataTable
				placeholder='Đơn vị chưa có vũ khí/trang bị nào'
				columns={buildMaterialAssetColumns(
					students ?? [],
					handleChanged
				)}
				data={companyAssets}
				toolbarProps={{
					searchConfig,
					facetedFilters
				}}
			/>
		</div>
	)
}
