import AuditLogTab from '@/components/audit-log'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nhat-ky-hoat-dong')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<AuditLogTab />
		</ProtectedRoute>
	)
}
