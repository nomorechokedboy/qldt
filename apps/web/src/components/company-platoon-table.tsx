import UnitCard from '@/components/unit-table/unit-card'
import PlatoonForm from '@/components/platoon-form'
import useUnitData from '@/hooks/useUnitData'

type CompanyPlatoonTableProps = {
	companyAlias: string
}

export default function CompanyPlatoonTable({
	companyAlias
}: CompanyPlatoonTableProps) {
	const { data: company, refetch } = useUnitData({ alias: companyAlias })

	const platoons =
		company?.children?.filter((u) => u.level === 'platoon') ?? []

	return (
		<div className='flex flex-1 flex-col space-y-8 p-8'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					Danh sách trung đội của {company?.name}
				</h2>
				{company?.id !== undefined && (
					<PlatoonForm
						companyId={company.id}
						onSuccess={() => refetch()}
					/>
				)}
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
					Đại đội chưa có trung đội nào.
				</p>
			)}
		</div>
	)
}
