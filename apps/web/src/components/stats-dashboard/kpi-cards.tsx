import { Building2, DoorOpen, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { units } from '@/api/client'

export default function KpiCards({
	stats
}: {
	stats: units.GetUnitStatsResponse
}) {
	const { t } = useTranslation('units')
	const cards = [
		{
			label: t('dashboard.kpiTotalTroops'),
			value: stats.totalStudents,
			icon: Users,
			color: 'text-blue-600'
		},
		{
			label: t('dashboard.kpiBuildings'),
			value: stats.buildingsCount,
			icon: Building2,
			color: 'text-green-600'
		},
		{
			label: t('dashboard.kpiRooms'),
			value: stats.roomsCount,
			icon: DoorOpen,
			color: 'text-amber-600'
		}
	]

	return (
		<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
			{cards.map(({ label, value, icon: Icon, color }) => (
				<Card key={label}>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							{label}
						</CardTitle>
						<Icon className={`h-5 w-5 ${color}`} />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-foreground'>
							{value}
						</div>
						<p className='text-xs text-muted-foreground'>
							{t('dashboard.kpiScope', { name: stats.unit.name })}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
