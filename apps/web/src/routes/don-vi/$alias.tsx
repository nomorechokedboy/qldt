import { EduLevelOptions } from '@/components/data-table/data/data'
import ProtectedRoute from '@/components/ProtectedRoute'
import { battalionStudentColumnsWithoutAction } from '@/components/student-table/columns'
import { defaultBirthdayColumnVisibility } from '@/components/student-table/default-columns-visibility'
import StudentTable from '@/components/student-table/new-student-table'
import TableSkeleton from '@/components/table-skeleton'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EhtnicOptions } from '@/data/ethnicities'
import { unitLevelOrder } from '@/data/unit-levels'
import useActionColumn from '@/hooks/useActionColumn'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import useOnDeleteStudents from '@/hooks/useOnDeleteStudents'
import useStudentData from '@/hooks/useStudents'
import useUnitData from '@/hooks/useUnitData'
import { createFileRoute } from '@tanstack/react-router'
import type { UnitLevel } from '@/types'
import z from 'zod'
import useAuth from '@/hooks/useAuth'

const aliasSearchSchema = z.object({
	level: z.enum(unitLevelOrder as [string, ...string[]]).default('battalion'),
	name: z.string().default('')
})

export const Route = createFileRoute('/don-vi/$alias')({
	component: RouteComponent,
	validateSearch: aliasSearchSchema
})

function RouteComponent() {
	const { alias } = Route.useParams()
	const { level: rawLevel } = Route.useSearch()
	const level = rawLevel as UnitLevel

	const { user } = useAuth()
	const { createFacetedFilter } = useDataTableToolbarConfig()
	const {
		data: students = [],
		isLoading: isLoadingStudents,
		refetch: refetchStudents
	} = useStudentData({ unitAlias: alias, unitLevel: level })
	const { data: unit } = useUnitData({ alias, level })
	const filename = `danh-sach-quan-nhan-${alias}`
	const handleDeleteStudents = useOnDeleteStudents(refetchStudents)

	const handleFormSuccess = () => {
		refetchStudents()
	}
	const actionColumn = useActionColumn(() => {
		return refetchStudents()
	})

	if (isLoadingStudents) {
		return <TableSkeleton />
	}

	const militaryRankSet = new Set(
		students.filter((s) => !!s.rank).map((s) => s.rank)
	)
	const militaryRankOptions = Array.from(militaryRankSet).map((rank) => ({
		label: rank,
		value: rank
	}))
	const collectSquadOptions = (node?: {
		alias: string
		name: string
		level: string
		children?: any[]
	}): { label: string; value: string }[] => {
		if (!node) return []
		if (node.level === 'squad') {
			return [{ label: node.name, value: node.name }]
		}
		return (node.children ?? []).flatMap(collectSquadOptions)
	}
	const classOptions = (unit?.children ?? []).flatMap((c) =>
		collectSquadOptions(c).map((opt) => ({
			label: `${opt.label} - ${c.alias}`,
			value: `${opt.label} - ${c.alias}`
		}))
	)

	const previousUnitSet = new Set(
		students.filter((s) => !!s.previousUnit).map((s) => s.previousUnit)
	)
	const previousUnitOptions = Array.from(previousUnitSet).map((pu) => ({
		label: pu,
		value: pu
	}))

	const facetedFilters = [
		createFacetedFilter('class.name', 'Tiểu đội', classOptions),
		createFacetedFilter('rank', 'Cấp bậc', militaryRankOptions),
		createFacetedFilter('previousUnit', 'Đơn vị cũ', previousUnitOptions),
		createFacetedFilter('ethnic', 'Dân tộc', EhtnicOptions),
		createFacetedFilter(
			'educationLevel',
			'Trình độ học vấn',
			EduLevelOptions
		)
	]

	return (
		<ProtectedRoute>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<div className='flex items-center justify-between space-y-2'>
					<div>
						<h2 className='text-2xl font-bold tracking-tight'>
							{unit?.name}
						</h2>
						<p className='text-muted-foreground'>
							Quản lý quân nhân, cơ sở vật chất và vũ khí/trang bị
						</p>
					</div>
				</div>

				<Tabs defaultValue='students'>
					<TabsList>
						<TabsTrigger value='students'>Quân nhân</TabsTrigger>
						<TabsTrigger value='facilities'>
							Cơ sở vật chất
						</TabsTrigger>
						<TabsTrigger value='weapons'>
							Vũ khí/trang bị
						</TabsTrigger>
					</TabsList>

					<TabsContent value='students'>
						<StudentTable
							params={{ unitAlias: alias, unitLevel: level }}
							columnVisibility={{
								...defaultBirthdayColumnVisibility,
								address: false,
								status: false
							}}
							columns={[
								...battalionStudentColumnsWithoutAction,
								actionColumn
							]}
							facetedFilters={facetedFilters}
							placeholder='Chưa có thông tin quân nhân.'
							exportConfig={{
								filename,
								defaultExportValues: {
									unitName: unit?.parent?.name.toUpperCase(),
									underUnitName: unit?.name.toUpperCase()
								}
							}}
							onDeleteRows={handleDeleteStudents}
							onCreateSuccess={handleFormSuccess}
							enableCreation
							showRefreshButton
						/>
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitAlias={alias} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitAlias={alias} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
