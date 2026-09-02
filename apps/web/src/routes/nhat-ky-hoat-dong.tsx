import AuditLogTab from '@/components/audit-log'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nhat-ky-hoat-dong')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<SidebarInset>
				<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
					<div className='flex items-center justify-between space-y-2'>
						<div>
							<h2 className='text-2xl font-bold tracking-tight'>
								Nhật ký hoạt động
							</h2>
						</div>
					</div>
					<div className='mt-4'>
						<AuditLogTab />
					</div>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}
