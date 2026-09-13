import ActivityStatusProposalsTab from '@/components/activity-status-proposals'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/de-xuat-che-do')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute requiredPermission='activity_status_proposals:read'>
			<SidebarInset>
				<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
					<div className='flex items-center justify-between space-y-2'>
						<div>
							<h2 className='text-2xl font-bold tracking-tight'>
								Đề xuất chế độ
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
