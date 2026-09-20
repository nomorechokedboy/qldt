import ActivityStatusProposalsTab from '@/components/activity-status-proposals'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/de-xuat-che-do')({
	component: RouteComponent
})

function RouteComponent() {
	const { t } = useTranslation('proposals')

	return (
		<ProtectedRoute requiredPermission='activity_status_proposals:read'>
			<SidebarInset>
				<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
					<div className='flex items-center justify-between space-y-2'>
						<div>
							<h2 className='text-2xl font-bold tracking-tight'>
								{t('route.activityTitle')}
							</h2>
						</div>
					</div>
					<div className='mt-4'>
						<ActivityStatusProposalsTab />
					</div>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
