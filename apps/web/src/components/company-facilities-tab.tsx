import BuildingCard from '@/components/facility-table/building-card'
import BuildingForm from '@/components/building-form'
import MaterialStockForm from '@/components/material-stock-form'
import { buildMaterialStockColumns } from '@/components/material-stock-table/columns'
import { DataTable } from '@/components/data-table'
import useUnitData from '@/hooks/useUnitData'
import useBuildingsData from '@/hooks/useBuildingsData'
import useRoomsData from '@/hooks/useRoomsData'
import useMaterialStocksData from '@/hooks/useMaterialStocksData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { materialConditionOptions } from '@/data/material-categories'

type CompanyFacilitiesTabProps = {
	unitAlias: string
}

export default function CompanyFacilitiesTab({
	unitAlias
}: CompanyFacilitiesTabProps) {
	const { data: company, refetch: refetchUnit } = useUnitData({
		alias: unitAlias
	})
	const { data: buildings, refetch: refetchBuildings } = useBuildingsData({
		enabled: true
	})
	const { data: rooms, refetch: refetchRooms } = useRoomsData(
		{},
		{ enabled: true }
	)
	const { data: stocks, refetch: refetchStocks } = useMaterialStocksData(
		{},
		{ enabled: true }
	)
	const { data: materialTypes } = useMaterialTypesData({ enabled: true })
	const { createSearchConfig, createFacetedFilter } =
		useDataTableToolbarConfig()

	const unitOptions = company ? [company] : []
	const unitIds = unitOptions.map((u) => u.id)
	const companyBuildings =
		buildings?.filter((b) => unitIds.includes(b.unitId)) ?? []
	const companyRooms = rooms?.filter((r) => unitIds.includes(r.unitId)) ?? []
	const companyStocks =
		stocks?.filter((s) => unitIds.includes(s.unitId)) ?? []
	const supplyTypes = materialTypes?.filter((t) => !t.isSerialized) ?? []

	const handleChanged = () => {
		refetchUnit()
		refetchBuildings()
		refetchRooms()
	}

	const handleStockChanged = () => {
		refetchStocks()
	}

	const searchConfig = [
		createSearchConfig('materialType', 'Tìm kiếm theo loại vật tư...')
	]

	const roomOptions = [
		{
			label: 'Không thuộc phòng cụ thể',
			value: 'Không thuộc phòng cụ thể'
		},
		...companyRooms.map((r) => ({ label: r.name, value: r.name }))
	]
	const facetedFilters = [
		createFacetedFilter(
			'condition',
			'Tình trạng',
			materialConditionOptions
		),
		createFacetedFilter('room', 'Phòng', roomOptions)
	]

	return (
		<div className='flex flex-1 flex-col space-y-8 p-8'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					Cơ sở vật chất của {company?.name}
				</h2>
				{company?.id !== undefined && (
					<BuildingForm
						unitOptions={unitOptions}
						defaultUnitId={company.id}
						onSuccess={handleChanged}
					/>
				)}
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{companyBuildings.map((building) => (
					<BuildingCard
						key={building.id}
						data={building}
						onChanged={handleChanged}
					/>
				))}
			</div>

			{companyBuildings.length === 0 && (
				<p className='text-muted-foreground'>
					Đơn vị chưa có nhà/khu nhà nào.
				</p>
			)}

			<div className='flex items-center justify-between space-y-2 pt-4 border-t'>
				<h2 className='text-2xl font-bold tracking-tight'>
					Vật tư sinh hoạt
				</h2>
				{company?.id !== undefined && (
					<MaterialStockForm
						unitOptions={unitOptions}
						defaultUnitId={company.id}
						roomOptions={companyRooms}
						materialTypeOptions={supplyTypes}
						onSuccess={handleStockChanged}
					/>
				)}
			</div>

			<DataTable
				placeholder='Đơn vị chưa có vật tư sinh hoạt nào'
				columns={buildMaterialStockColumns(
					companyRooms,
					handleStockChanged
				)}
				data={companyStocks}
				toolbarProps={{ searchConfig, facetedFilters }}
			/>
		</div>
	)
}
