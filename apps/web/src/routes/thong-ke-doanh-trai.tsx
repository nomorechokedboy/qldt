import BaseStatsDashboard from '@/components/base-stats-dashboard'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

const searchSchema = z.object({
	unit: z.string().optional()
})

export const Route = createFileRoute('/thong-ke-doanh-trai')({
	component: RouteComponent,
	validateSearch: searchSchema
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<SidebarInset>
				<BaseStatsDashboard />
			</SidebarInset>
		</ProtectedRoute>
	)
}
