import { useTranslation } from 'react-i18next'
import TableSkeleton from '@/components/table-skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UnitRollupTables from '@/components/unit-rollup-tables'
import UnitSelect from '@/components/unit/select'
import useUnitOptions from '@/hooks/useUnitOptions'
import useUnitStats from '@/hooks/useUnitStats'
import StatsOverview from './stats-dashboard/stats-overview'
import usePoliticsCharts from './stats-dashboard/use-politics-charts'
import useStatsSelection from './stats-dashboard/use-stats-selection'

export default function BaseStatsDashboard() {
	const { t } = useTranslation('units')
	const {
		units,
		unitsById,
		options: unitOptions,
		isLoading: isLoadingUnits
	} = useUnitOptions({ minLevel: 'platoon' })
	const { selectedUnitId, period, selectUnit, selectPeriod } =
		useStatsSelection(units)

	const { data: stats, isLoading: isLoadingStats } =
		useUnitStats(selectedUnitId)
	// Only units in the list above have a report; a unit below the minimum
	// level (a squad) has none.
	const selectedUnit = units.find((u) => u.id === selectedUnitId)
	const politics = usePoliticsCharts(selectedUnit?.id)

	if (isLoadingUnits) {
		return <TableSkeleton />
	}

	const overview = stats !== undefined && (
		<StatsOverview
			stats={stats}
			politics={politics}
			period={period}
			onPeriodChange={selectPeriod}
		/>
	)
	// A squad has nothing beneath it to break down.
	const showRollupTabs = stats !== undefined && stats.unit.level !== 'squad'

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>
						{t('dashboard.title')}
					</h2>
					<p className='text-muted-foreground'>
						{t('dashboard.subtitle')}
					</p>
				</div>

				<UnitSelect
					options={unitOptions}
					value={
						selectedUnitId === undefined
							? undefined
							: String(selectedUnitId)
					}
					onValueChange={selectUnit}
					className='md:w-[280px]'
				/>
			</div>

			{selectedUnitId === undefined && (
				<p className='text-muted-foreground'>
					{t('dashboard.noUnitAssigned')}
				</p>
			)}

			{selectedUnitId !== undefined && isLoadingStats && (
				<TableSkeleton />
			)}

			{stats !== undefined &&
				(showRollupTabs ? (
					<Tabs defaultValue='overview'>
						<TabsList>
							<TabsTrigger value='overview'>
								{t('dashboard.overview')}
							</TabsTrigger>
							<TabsTrigger value='details'>
								{t('dashboard.details')}
							</TabsTrigger>
						</TabsList>

						<TabsContent value='overview'>{overview}</TabsContent>

						<TabsContent value='details'>
							<UnitRollupTables
								unitId={stats.unit.id}
								unit={selectedUnit}
								unitsById={unitsById}
							/>
						</TabsContent>
					</Tabs>
				) : (
					overview
				))}
		</div>
	)
}
