import ProtectedRoute from '@/components/ProtectedRoute'
import TableSkeleton from '@/components/table-skeleton'
import { unitLevelOrder } from '@/data/unit-levels'
import useActionColumn from '@/hooks/useActionColumn'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import useUnitData from '@/hooks/useUnitData'
import useUnitTroopersData from '@/hooks/useUnitTroopersData'
import { createFileRoute } from '@tanstack/react-router'
import type { UnitLevel } from '@/types'
import z from 'zod'
import UnitPageHeader from '@/components/unit/page-header'
import UnitTabs from '@/components/unit/tabs'
import useUnitFacetedFilters from '@/hooks/useUnitFacetedFilter'

const aliasSearchSchema = z.object({
	level: z.enum(unitLevelOrder as [string, ...string[]]).default('battalion'),
	name: z.string().default(''),
	id: z.number().nonoptional()
})

export const Route = createFileRoute('/don-vi/$alias')({
	component: RouteComponent,
	validateSearch: aliasSearchSchema
})

function RouteComponent() {
	const { alias } = Route.useParams()
	const { level: rawLevel, id } = Route.useSearch()
	const level = rawLevel as UnitLevel

	const {
		data: troopers = [],
		isLoading: isLoadingStudents,
		refetch: refetchStudents
	} = useUnitTroopersData({ id })
	const { data: unit } = useUnitData({ alias, level, id })

	const facetedFilters = useUnitFacetedFilters({ troopers, unit })
	const handleDeleteStudents = useOnDeleteStudents(refetchStudents)
	const actionColumn = useActionColumn(() => refetchStudents())

	if (isLoadingStudents) {
		return <TableSkeleton />
	}

	return (
		<ProtectedRoute>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<UnitPageHeader title={unit?.name} />
				<UnitTabs
					alias={alias}
					level={level}
					unitName={unit?.name}
					parentUnitName={unit?.parent?.name}
					data={troopers}
					isLoading={isLoadingStudents}
					refetch={refetchStudents}
					facetedFilters={facetedFilters}
					actionColumn={actionColumn}
					onDeleteRows={handleDeleteStudents}
					onCreateSuccess={refetchStudents}
				/>
			</div>
		</ProtectedRoute>
	)
}
