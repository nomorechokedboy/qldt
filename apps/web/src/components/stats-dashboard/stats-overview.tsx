import UnitPeriodStats from '@/components/unit-period-stats'
import WeaponsOverview from '@/components/weapons-overview'
import type { units } from '@/api/client'
import type { StatsPeriod } from '@/lib/stats-period'
import KpiCards from './kpi-cards'
import PoliticsStatsCard from './politics-stats-card'
import SuppliesCard from './supplies-card'
import TroopStructureCard from './troop-structure-card'
import UnitStructureCard from './unit-structure-card'
import type { PoliticsCharts } from './use-politics-charts'

interface StatsOverviewProps {
	stats: units.GetUnitStatsResponse
	politics: PoliticsCharts
	period: StatsPeriod
	onPeriodChange: (period: StatsPeriod) => void
}

// The "overview" of one unit: headline figures, structure, troop and supply
// breakdowns, weapons, and what changed in the chosen period.
export default function StatsOverview({
	stats,
	politics,
	period,
	onPeriodChange
}: StatsOverviewProps) {
	return (
		<div className='space-y-6'>
			<KpiCards stats={stats} />
			<UnitStructureCard unitCounts={stats.unitCounts} />
			<TroopStructureCard troopSummary={stats.troopSummary} />
			<PoliticsStatsCard {...politics} />

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				<SuppliesCard
					materialStockSummary={stats.materialStockSummary}
				/>
			</div>

			<WeaponsOverview
				summary={stats.weaponSummary}
				unitId={stats.unit.id}
			/>
			<UnitPeriodStats
				unitId={stats.unit.id}
				period={period}
				onPeriodChange={onPeriodChange}
			/>
		</div>
	)
}
