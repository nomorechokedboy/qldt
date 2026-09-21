import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import PositionCatalog from '@/components/position-catalog'

export const Route = createFileRoute('/chuc-vu')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute superAdminOnly>
			<PositionCatalog />
		</ProtectedRoute>
	)
}
