import TransferRequestsTab from '@/components/transfer-requests'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chuyen-giao-tai-san')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute requiredPermission='transfer_requests:read'>
			<SidebarInset>
				<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
					<div className='flex items-center justify-between space-y-2'>
						<div>
							<h2 className='text-2xl font-bold tracking-tight'>
								Chuyển giao nguồn lực
							</h2>
						</div>
					</div>
					<div className='mt-4'>
						<TransferRequestsTab />
					</div>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
