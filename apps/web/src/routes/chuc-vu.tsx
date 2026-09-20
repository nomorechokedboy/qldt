import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import PositionForm from '@/components/position-form'
import { buildPositionColumns } from '@/components/position-table/columns'
import { DataTable } from '@/components/data-table'
import usePositionsData from '@/hooks/usePositionsData'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/chuc-vu')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<PositionCatalog />
		</ProtectedRoute>
	)
}

// Level values are what the API stores; labels come from `positions.levels`.
const LEVELS = [
	'squad',
	'platoon',
	'company',
	'battalion',
	'brigade',
	'regiment',
	'division'
] as const

function PositionCatalog() {
	const { t } = useTranslation('admin')
	const [level, setLevel] = useState<string>('battalion')

	return (
		<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					{t('positions.title')}
				</h2>
			</div>
			<Tabs value={level} onValueChange={setLevel}>
				<TabsList>
					{LEVELS.map((l) => (
						<TabsTrigger key={l} value={l}>
							{t(`positions.levels.${l}`)}
						</TabsTrigger>
					))}
				</TabsList>
				{LEVELS.map((l) => (
					<TabsContent key={l} value={l}>
						<PositionLevelTable level={l} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	)
}

function PositionLevelTable({ level }: { level: string }) {
	const { t } = useTranslation('admin')
	const { data: positions, refetch } = usePositionsData(
		{ level },
		{ enabled: true }
	)
	const { createSearchConfig } = useDataTableToolbarConfig()

	const searchConfig = [
		createSearchConfig('name', t('positions.searchPlaceholder'))
	]

	const sorted = [...(positions ?? [])].sort(
		(a, b) => a.priority - b.priority
	)

	return (
		<DataTable
			placeholder={t('positions.empty')}
			columns={buildPositionColumns(() => refetch())}
			data={sorted}
			onRefresh={() => refetch()}
			toolbarProps={{
				rightSection: (
					<PositionForm level={level} onSuccess={() => refetch()} />
				),
				searchConfig
			}}
		/>
	)
}
