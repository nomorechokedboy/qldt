import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatsPeriodSelector from '@/components/stats-period-selector'
import useUnitStatsPeriod from '@/hooks/useUnitStatsPeriod'
import { periodRange, type StatsPeriod } from '@/lib/stats-period'

function FigureList({
	title,
	figures
}: {
	title: string
	figures: { label: string; value: number }[]
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className='space-y-2'>
					{figures.map((figure) => (
						<li
							key={figure.label}
							className='flex items-center justify-between border-b pb-2 last:border-0'
						>
							<span>{figure.label}</span>
							<span className='font-semibold'>
								{figure.value}
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	)
}

interface UnitPeriodStatsProps {
	unitId: number
	// Controlled by the caller so the choice can live in the URL.
	period: StatsPeriod
	onPeriodChange: (period: StatsPeriod) => void
}

export default function UnitPeriodStats({
	unitId,
	period,
	onPeriodChange
}: UnitPeriodStatsProps) {
	const { t } = useTranslation('units')
	const range = periodRange(period)
	const { data, isLoading, isError } = useUnitStatsPeriod(unitId, range)

	return (
		<section className='space-y-4'>
			<div className='flex flex-wrap items-end justify-between gap-2'>
				<div>
					<h2 className='text-xl font-semibold'>
						{t('dashboard.period.title')}
					</h2>
					<p className='text-sm text-muted-foreground'>
						{t('dashboard.period.subtitle')}{' '}
						{t('dashboard.period.range', range)}
					</p>
				</div>
				<StatsPeriodSelector value={period} onChange={onPeriodChange} />
			</div>

			{isError ? (
				<p role='alert' className='text-destructive'>
					{t('dashboard.period.loadFailed')}
				</p>
			) : isLoading || !data ? (
				<p className='text-muted-foreground'>…</p>
			) : (
				<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
					<FigureList
						title={t('dashboard.period.weaponActivity')}
						figures={(
							[
								'assigned',
								'unassigned',
								'transferred',
								'damaged',
								'lost',
								'retired'
							] as const
						).map((key) => ({
							label: t(`dashboard.period.${key}`),
							value: data.weaponActivity[key]
						}))}
					/>
					<FigureList
						title={t('dashboard.period.troopMovement')}
						figures={(
							[
								'joined',
								'transferredIn',
								'transferredOut',
								'promoted',
								'discharged',
								'cpvAdmitted'
							] as const
						).map((key) => ({
							label: t(`dashboard.period.${key}`),
							value: data.troopMovement[key]
						}))}
					/>
					<Card>
						<CardHeader>
							<CardTitle>
								{t('dashboard.period.supplyMovement')}
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							{data.supplyMovement.length === 0 ? (
								<p className='text-muted-foreground'>
									{t('dashboard.period.noSupplyMovement')}
								</p>
							) : (
								<ul className='space-y-2'>
									{data.supplyMovement.map((item) => (
										<li
											key={item.materialTypeId}
											className='flex items-center justify-between gap-2 border-b pb-2 last:border-0'
										>
											<span>{item.materialTypeName}</span>
											<span className='text-sm'>
												{t('dashboard.period.received')}{' '}
												<b>{item.received}</b> ·{' '}
												{t('dashboard.period.sent')}{' '}
												<b>{item.sent}</b>
											</span>
										</li>
									))}
								</ul>
							)}
							<p className='text-xs text-muted-foreground'>
								{t('dashboard.period.supplyNote')}
							</p>
						</CardContent>
					</Card>
				</div>
			)}
		</section>
	)
}
