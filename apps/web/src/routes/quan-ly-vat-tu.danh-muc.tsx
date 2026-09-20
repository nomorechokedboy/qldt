import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import MaterialTypeForm from '@/components/material-type-form'
import { buildMaterialTypeColumns } from '@/components/material-type-table/columns'
import { DataTable } from '@/components/data-table'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { materialCategoryOptions } from '@/data/material-categories'

export const Route = createFileRoute('/quan-ly-vat-tu/danh-muc')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<MaterialTypeCatalog />
		</ProtectedRoute>
	)
}

function MaterialTypeCatalog() {
	const { t } = useTranslation('materials')
	const { data: materialTypes, refetch } = useMaterialTypesData({
		enabled: true
	})
	const { createSearchConfig, createFacetedFilter } =
		useDataTableToolbarConfig()

	const searchConfig = [
		createSearchConfig('name', t('catalog.searchPlaceholder'))
	]
	const facetedFilters = [
		createFacetedFilter(
			'category',
			t('columns.category'),
			materialCategoryOptions
		)
	]

	return (
		<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					{t('catalog.title')}
				</h2>
			</div>
			<DataTable
				placeholder={t('catalog.empty')}
				columns={buildMaterialTypeColumns(() => refetch())}
				data={materialTypes ?? []}
				onRefresh={() => refetch()}
				toolbarProps={{
					rightSection: (
						<MaterialTypeForm onSuccess={() => refetch()} />
					),
					searchConfig,
					facetedFilters
				}}
			/>
		</div>
	)
}
