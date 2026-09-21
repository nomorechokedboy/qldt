import BaseStatsDashboard from '@/components/base-stats-dashboard'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'

const searchSchema = z.object({
	unit: z.number().optional(),
	// The selected statistics period, e.g. "2026-09", "2026-Q3" or "2026-Y"
	// (see formatPeriod). A bare year arrives as a number, so both are
	// accepted; anything that isn't a real period falls back to the current
	// month where it is read.
	period: z.union([z.string(), z.number()]).optional().catch(undefined)
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
