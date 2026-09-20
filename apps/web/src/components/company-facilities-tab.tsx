import BuildingForm from '@/components/building-form'
import { DataTable } from '@/components/data-table'
import { ExportMaterialStocksDialog } from '@/components/export-material-stocks-dialog'
import { ExportTemplateManager } from '@/components/export-template-manager'
import BuildingCard from '@/components/facility-table/building-card'
import { LazyImportMaterialStocksDialog as ImportMaterialStocksDialog } from '@/components/import-material-stocks-dialog-lazy'
import MaterialStockForm from '@/components/material-stock-form'
import { buildMaterialStockColumns } from '@/components/material-stock-table/columns'
import { Button } from '@/components/ui/button'
import { materialConditionOptions } from '@/data/material-categories'
import useBuildingsData from '@/hooks/useBuildingsData'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import useMaterialStocksData from '@/hooks/useMaterialStocksData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useRoomsData from '@/hooks/useRoomsData'
import useUnitData from '@/hooks/useUnitData'
import type { MaterialStock } from '@/types'
import { ArrowDownToLine, Settings, Upload } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type CompanyFacilitiesTabProps = {
	unitId: number
}

export default function CompanyFacilitiesTab({
	unitId
}: CompanyFacilitiesTabProps) {
	const { t } = useTranslation('units')
	const { data: company, refetch: refetchUnit } = useUnitData({ id: unitId })
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
	const [importStocksOpen, setImportStocksOpen] = useState(false)

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
		createSearchConfig('materialType', t('materialTables.searchSupplyType'))
	]

	const roomOptions = [
		{
			label: t('materialTables.noRoom'),
			// matches the placeholder the stock table's room column reports
			value: 'Chưa có vị trí cụ thể'
		},
		...companyRooms.map((r) => ({ label: r.name, value: r.name }))
	]
	const facetedFilters = [
		createFacetedFilter(
			'condition',
			t('materialTables.condition'),
			materialConditionOptions
		),
		createFacetedFilter('room', t('materialTables.room'), roomOptions)
	]

	return (
		<div className='flex flex-1 flex-col space-y-8 p-8'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					{t('company.facilitiesTitle', {
						name: company?.name ?? ''
					})}
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
					{t('company.noBuildings')}
				</p>
			)}

			<div className='flex items-center justify-between space-y-2 pt-4 border-t'>
				<h2 className='text-2xl font-bold tracking-tight'>
					{t('company.suppliesTitle')}
				</h2>
				{company?.id !== undefined && (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							onClick={() => setImportStocksOpen(true)}
						>
							<Upload />
							{t('materialTables.import')}
						</Button>
						<MaterialStockForm
							unitOptions={unitOptions}
							defaultUnitId={company.id}
							roomOptions={companyRooms}
							materialTypeOptions={supplyTypes}
							onSuccess={handleStockChanged}
						/>
					</div>
				)}
			</div>

			<ImportMaterialStocksDialog
				isOpen={importStocksOpen}
				onClose={() => setImportStocksOpen(false)}
				onSuccess={handleStockChanged}
			/>

			<DataTable
				placeholder={t('company.noSupplies')}
				columns={buildMaterialStockColumns(
					companyRooms,
					handleStockChanged
				)}
				data={companyStocks}
				onRefresh={() =>
					Promise.all([
						refetchUnit(),
						refetchBuildings(),
						refetchRooms(),
						refetchStocks()
					])
				}
				toolbarProps={{ searchConfig, facetedFilters }}
				withDynamicColsData={false}
				renderToolbarActions={({ exportHook }) => (
					<>
						<ExportTemplateManager resourceType='material_stocks'>
							<Button variant='outline'>
								<Settings />
								{t('materialTables.manageTemplates')}
							</Button>
						</ExportTemplateManager>
						<ExportMaterialStocksDialog
							data={
								exportHook.exportableData
									.data as unknown as MaterialStock[]
							}
							defaultFilename={`vat-tu-sinh-hoat-${company?.name ?? ''}`}
							defaultValues={{
								unitName: company?.name,
								underUnitName: company?.parent?.name
							}}
						>
							<Button>
								<ArrowDownToLine />
								{t('materialTables.export')}
							</Button>
						</ExportMaterialStocksDialog>
					</>
				)}
			/>
		</div>
	)
}
