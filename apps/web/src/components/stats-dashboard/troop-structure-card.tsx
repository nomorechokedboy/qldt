import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from '@/components/ui/chart'
import type { units } from '@/api/client'
import { TROOP_CHART_COLORS } from './constants'
import SectionCard from './section-card'
import StatTile from './stat-tile'

const TROOP_KINDS = ['sq', 'qncn', 'hsq', 'bs'] as const

const TROOP_LABEL_KEYS = {
	sq: 'dashboard.troopSq',
	qncn: 'dashboard.troopQncn',
	hsq: 'dashboard.troopHsq',
	bs: 'dashboard.troopBs'
} as const

// Troops by category: officers, professional soldiers, NCOs and soldiers.
export default function TroopStructureCard({
	troopSummary
}: {
	troopSummary: units.GetUnitStatsResponse['troopSummary']
}) {
	const { t } = useTranslation('units')
	const tiles = TROOP_KINDS.map((kind, idx) => ({
		label: t(TROOP_LABEL_KEYS[kind]),
		value: troopSummary[kind],
		color: TROOP_CHART_COLORS[idx]
	}))
	// A category with nobody in it would only add an empty slice.
	const slices = tiles.filter(({ value }) => value > 0)

	return (
		<SectionCard icon={Users} title={t('dashboard.troopStructure')}>
			{slices.length === 0 ? (
				<p className='text-muted-foreground'>
					{t('dashboard.noTroopData')}
				</p>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
					<ChartContainer
						config={{ value: { label: t('dashboard.quantity') } }}
						className='h-[260px] w-full'
					>
						<ResponsiveContainer width='100%' height='100%'>
							<PieChart>
								<Pie
									data={slices}
									cx='50%'
									cy='50%'
									labelLine={false}
									label={({ name, percent }) =>
										`${name} ${(percent * 100).toFixed(0)}%`
									}
									outerRadius={80}
									dataKey='value'
									nameKey='label'
								>
									{slices.map((entry) => (
										<Cell
											key={entry.label}
											fill={entry.color}
										/>
									))}
								</Pie>
								<ChartTooltip
									content={<ChartTooltipContent />}
								/>
							</PieChart>
						</ResponsiveContainer>
					</ChartContainer>

					<div className='grid grid-cols-2 gap-4'>
						{tiles.map(({ label, value, color }) => (
							<StatTile
								key={label}
								label={label}
								value={value}
								color={color}
							/>
						))}
					</div>
				</div>
			)}
		</SectionCard>
	)
}
