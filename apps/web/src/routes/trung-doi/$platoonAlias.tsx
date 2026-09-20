import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import CompanyFacilitiesTab from '@/components/company-facilities-tab'
import CompanyWeaponsTab from '@/components/company-weapons-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import z from 'zod'
import { useTranslation } from 'react-i18next'
import CompanyStudentTable from '@/components/company-student-table'

const plattonAliasSearchSchema = z.object({ id: z.number().nonoptional() })

export const Route = createFileRoute('/trung-doi/$platoonAlias')({
	component: RouteComponent,
	validateSearch: plattonAliasSearchSchema
})

function RouteComponent() {
	const { t } = useTranslation('units')
	const { platoonAlias } = Route.useParams()
	const { id } = Route.useSearch()

	return (
		<ProtectedRoute>
			<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
				<Tabs defaultValue='students'>
					<TabsList>
						<TabsTrigger value='students'>
							{t('tabs.students')}
						</TabsTrigger>
						<TabsTrigger value='facilities'>
							{t('tabs.facilities')}
						</TabsTrigger>
						<TabsTrigger value='weapons'>
							{t('tabs.weapons')}
						</TabsTrigger>
					</TabsList>

					<TabsContent value='students'>
						<CompanyStudentTable alias={platoonAlias} id={id} />
					</TabsContent>

					<TabsContent value='facilities'>
						<CompanyFacilitiesTab unitId={id} />
					</TabsContent>

					<TabsContent value='weapons'>
						<CompanyWeaponsTab unitId={id} />
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	)
}
