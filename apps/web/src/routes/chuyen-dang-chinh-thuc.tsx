import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import { SidebarInset } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CpvOfficialThisWeek from '@/components/cpv-official-this-week'
import CpvOfficialInMonth from '@/components/cpv-official-in-month'
import CpvOfficialInQuarter from '@/components/cpv-official-in-quarter'
import ProtectedRoute from '@/components/ProtectedRoute'

export const Route = createFileRoute('/chuyen-dang-chinh-thuc')({
	component: RouteComponent
})

function RouteComponent() {
	const { t } = useTranslation('stats')
	return (
		<ProtectedRoute>
			<SidebarInset>
				<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
					<Tabs defaultValue='week'>
						<TabsList>
							<TabsTrigger value='week'>
								{t('routes.tabWeek')}
							</TabsTrigger>
							<TabsTrigger value='month'>
								{t('routes.tabMonth')}
							</TabsTrigger>
							<TabsTrigger value='quarter'>
								{t('routes.tabQuarter')}
							</TabsTrigger>
						</TabsList>

						<TabsContent value='week'>
							<CpvOfficialThisWeek />
						</TabsContent>

						<TabsContent value='month'>
							<CpvOfficialInMonth />
						</TabsContent>

						<TabsContent value='quarter'>
							<CpvOfficialInQuarter />
						</TabsContent>
					</Tabs>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
