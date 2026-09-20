import { useTranslation } from 'react-i18next'
import UnitCard from '@/components/unit-table/unit-card'
import PlatoonForm from '@/components/platoon-form'
import useUnitData from '@/hooks/useUnitData'
import { Button } from '@/components/ui/button'
import RefreshButton from '@/components/refresh-button'

type CompanyPlatoonTableProps = {
	companyId: number
}

export default function CompanyPlatoonTable({
	companyId
}: CompanyPlatoonTableProps) {
	const { t } = useTranslation('units')
	const { data: company, refetch } = useUnitData({ id: companyId })

	const platoons =
		company?.children?.filter((u) => u.level === 'platoon') ?? []

	return (
		<div className='flex flex-1 flex-col space-y-8 p-8'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					{t('company.platoonListTitle', {
						name: company?.name ?? ''
					})}
				</h2>
				<div className='flex items-center gap-2'>
					<RefreshButton onRefresh={() => refetch()} />
					{company?.id !== undefined && (
						<PlatoonForm
							companyId={company.id}
							onSuccess={() => refetch()}
						/>
					)}
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{platoons.map((platoon) => (
					<UnitCard
						key={platoon.id}
						data={platoon}
						onEdit={() => refetch()}
						onDelete={() => refetch()}
					/>
				))}
			</div>

			{platoons.length === 0 && (
				<p className='text-muted-foreground'>
					{t('company.noPlatoons')}
				</p>
			)}
		</div>
	)
}
