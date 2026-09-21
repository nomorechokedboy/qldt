import { Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PieChartCard } from '@/components/politics-quality-report/charts-section'
import TableSkeleton from '@/components/table-skeleton'
import SectionCard from './section-card'
import type { PoliticsCharts } from './use-politics-charts'

// Troop statistics by education, ethnicity, religion, political
// organisation and place of origin.
export default function PoliticsStatsCard({
	isLoading,
	charts,
	hasData
}: PoliticsCharts) {
	const { t } = useTranslation('units')

	return (
		<SectionCard icon={Target} title={t('dashboard.troopStats')}>
			{isLoading ? (
				<TableSkeleton />
			) : !hasData ? (
				<p className='text-muted-foreground'>
					{t('dashboard.noTroopStats')}
				</p>
			) : (
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
					<PieChartCard
						data={charts.education}
						title={t('dashboard.education')}
					/>
					<PieChartCard
						data={charts.ethnic}
						title={t('dashboard.ethnic')}
					/>
					<PieChartCard
						data={charts.religion}
						title={t('dashboard.religion')}
					/>
					<PieChartCard
						data={charts.politicalOrg}
						title={t('dashboard.politicalOrg')}
					/>
					<PieChartCard
						data={charts.birthPlace}
						title={t('dashboard.birthPlace')}
					/>
				</div>
			)}
		</SectionCard>
	)
}
