import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import UnitForm from '@/components/unit-form'
import UnitCard from '@/components/unit-table/unit-card'
import useUnitsData from '@/hooks/useUnitsData'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'

export const Route = createFileRoute('/quan-ly-don-vi')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<UnitManagement />
		</ProtectedRoute>
	)
}

function UnitManagement() {
	const { data: units, refetch } = useUnitsData()

	// Largest units first (Quân đoàn ... Tiểu đội).
	const levelsLargestFirst = [...unitLevelOrder].reverse()

	return (
		<div className='flex flex-1 flex-col space-y-8 p-8'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					Quản lý đơn vị
				</h2>
				<UnitForm onSuccess={() => refetch()} />
			</div>

			{levelsLargestFirst.map((level) => {
				if (level === 'platoon' || level === 'squad') {
					return
				}
				const unitsOfLevel =
					units?.filter((u) => u.level === level) ?? []
				if (unitsOfLevel.length === 0) return null

				return (
					<div key={level} className='space-y-4'>
						<h3 className='text-lg font-semibold'>
							{unitLevelLabels[level]}
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{unitsOfLevel.map((unit) => (
								<UnitCard
									key={unit.id}
									data={unit}
									onEdit={() => refetch()}
									onDelete={() => refetch()}
								/>
							))}
						</div>
					</div>
				)
			})}

			{units?.length === 0 && (
				<p className='text-muted-foreground'>Chưa có đơn vị nào.</p>
			)}
		</div>
	)
}
