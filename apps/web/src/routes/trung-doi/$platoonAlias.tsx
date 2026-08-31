import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyStudentTable from '@/components/company-student-table'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/trung-doi/$platoonAlias')({
	component: RouteComponent
})

function RouteComponent() {
	const { platoonAlias } = Route.useParams()

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
