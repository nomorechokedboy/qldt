import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyClassesTable from '@/components/company-classes-table'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyPlatoonTable from '@/components/company-platoon-table'
import CompanyStudentTable from '@/components/company-student-table'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PermissionTag } from '@/lib/permission-tags'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dai-doi/$companyAlias')({
	component: RouteComponent
})

function RouteComponent() {
	const { companyAlias } = Route.useParams()

	return (
		<ProtectedRoute>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<Tabs defaultValue='students'>
					<TabsList>
						<TabsTrigger value='students'>Quân nhân</TabsTrigger>
						<TabsTrigger value='platoons'>Trung đội</TabsTrigger>
						<TabsTrigger value='classes'>Tiểu đội</TabsTrigger>
						<TabsTrigger value='facilities'>
							Cơ sở vật chất
						</TabsTrigger>
						<TabsTrigger value='weapons'>
							Vũ khí/trang bị
						</TabsTrigger>
					</TabsList>

					<TabsContent value='platoons'>
						<CompanyPlatoonTable companyAlias={companyAlias} />
					</TabsContent>

					<TabsContent value='classes'>
						<CompanyClassesTable companyAlias={companyAlias} />
					</TabsContent>

					<TabsContent value='students'>
						<ProtectedRoute
							requiredPermission={PermissionTag.STUDENTS_READ}
						>
							<CompanyStudentTable
								alias={companyAlias}
								level='company'
							/>
						</ProtectedRoute>
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitAlias={companyAlias} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitAlias={companyAlias} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
