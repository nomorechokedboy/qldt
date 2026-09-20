import { useTranslation } from 'react-i18next'
import { createFileRoute } from '@tanstack/react-router'
import { SidebarInset } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BirthdayByWeek from '@/components/birthday-by-week'
import BirthdayByMonth from '@/components/birthday-by-month'
import BirthdayByQuarter from '@/components/birthday-by-quarter'
import ProtectedRoute from '@/components/ProtectedRoute'

export const Route = createFileRoute('/birthday')({
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
								{t('birthday.tabs.week')}
							</TabsTrigger>
							<TabsTrigger value='month'>
								{t('birthday.tabs.month')}
							</TabsTrigger>
							<TabsTrigger value='quarter'>
								{t('birthday.tabs.quarter')}
							</TabsTrigger>
						</TabsList>

						<TabsContent value='week'>
							<BirthdayByWeek />
						</TabsContent>

						<TabsContent value='month'>
							<BirthdayByMonth />
						</TabsContent>

						<TabsContent value='quarter'>
							<BirthdayByQuarter />
						</TabsContent>
					</Tabs>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
