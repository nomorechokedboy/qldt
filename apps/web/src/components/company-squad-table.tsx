import UnitCard from '@/components/unit-table/unit-card'
import SquadForm from '@/components/squad-form'
import useUnitData from '@/hooks/useUnitData'
import type { Unit } from '@/types'

type CompanySquadTableProps = {
	companyAlias: string
}

export default function CompanySquadTable({
	companyAlias
}: CompanySquadTableProps) {
	const { data: company, refetch } = useUnitData({ alias: companyAlias })

	const platoons: Unit[] =
		company?.children?.filter((u) => u.level === 'platoon') ?? []

	const squads: Unit[] = platoons.flatMap(
		(platoon) => platoon.children?.filter((u) => u.level === 'squad') ?? []
	)

	return (
		<div className='flex flex-1 flex-col space-y-8 p-8'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					Danh sách tiểu đội của {company?.name}
				</h2>
				<SquadForm
					platoonOptions={platoons}
					onSuccess={() => refetch()}
				/>
			</div>

			{platoons.length === 0 && (
				<p className='text-muted-foreground'>
					Đại đội chưa có trung đội nào. Cần tạo trung đội trước khi
					thêm tiểu đội.
				</p>
			)}

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{squads.map((squad) => (
					<UnitCard
						key={squad.id}
						data={squad}
						onEdit={() => refetch()}
						onDelete={() => refetch()}
					/>
				))}
			</div>

			{platoons.length > 0 && squads.length === 0 && (
				<p className='text-muted-foreground'>
					Đại đội chưa có tiểu đội nào.
				</p>
			)}
		</div>
	)
}
