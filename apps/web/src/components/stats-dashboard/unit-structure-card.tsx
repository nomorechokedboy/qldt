import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	XAxis,
	YAxis
} from 'recharts'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from '@/components/ui/chart'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import type { units } from '@/api/client'
import { TROOP_CHART_COLORS } from './constants'
import SectionCard from './section-card'
import StatTile from './stat-tile'

// How many units sit directly under this one, per level.
export default function UnitStructureCard({
	unitCounts
}: {
	unitCounts: units.GetUnitStatsResponse['unitCounts']
}) {
	const { t } = useTranslation('units')
	const data = unitLevelOrder
		.filter((level) => unitCounts[level] !== undefined)
		.map((level, idx) => ({
			level,
			label: unitLevelLabels[level],
			value: unitCounts[level] ?? 0,
			color: TROOP_CHART_COLORS[idx % TROOP_CHART_COLORS.length]
		}))
	// Many bars leave no room for horizontal labels.
	const crowded = data.length > 4

	return (
		<SectionCard icon={Shield} title={t('dashboard.subordinateStructure')}>
			{data.length === 0 ? (
				<p className='text-muted-foreground'>
					{t('dashboard.noSubordinates')}
				</p>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
					<ChartContainer
						config={{ value: { label: t('dashboard.quantity') } }}
						className='h-[260px] w-full'
					>
						<ResponsiveContainer width='100%' height='100%'>
							<BarChart data={data}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis
									dataKey='label'
									interval={0}
									tick={{ fontSize: 11 }}
									angle={crowded ? -30 : 0}
									textAnchor={crowded ? 'end' : 'middle'}
									height={crowded ? 50 : 30}
								/>
								<YAxis allowDecimals={false} width={32} />
								<ChartTooltip
									content={<ChartTooltipContent />}
								/>
								<Bar dataKey='value' radius={[4, 4, 0, 0]}>
									{data.map((entry) => (
										<Cell
											key={entry.level}
											fill={entry.color}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>

					<div className='grid grid-cols-2 gap-3 content-start max-h-[260px] overflow-y-auto pr-1'>
						{data.map(({ level, label, value, color }) => (
							<StatTile
								key={level}
								label={label}
								value={value}
								color={color}
								size='compact'
							/>
						))}
					</div>
				</div>
			)}
		</SectionCard>
	)
}
