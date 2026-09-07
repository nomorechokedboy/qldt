import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import z from 'zod'
import CompanyStudentTable from '@/components/company-student-table'

const plattonAliasSearchSchema = z.object({ id: z.number().nonoptional() })

export const Route = createFileRoute('/trung-doi/$platoonAlias')({
	component: RouteComponent,
	validateSearch: plattonAliasSearchSchema
})

function RouteComponent() {
	const { platoonAlias } = Route.useParams()
	const { id } = Route.useSearch()

	return (
		<ProtectedRoute>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
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
						<CompanyStudentTable
							alias={platoonAlias}
							level='platoon'
							id={id}
						/>
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitAlias={platoonAlias} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitAlias={platoonAlias} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
