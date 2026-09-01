import useAuth from '@/hooks/useAuth'
import { Navigate, useLocation } from '@tanstack/react-router'
import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { PageSkeleton } from './page-skeleton'

interface ProtectedRouteProps {
	children: React.ReactNode
	fallback?: React.ReactNode
	redirectTo?: string
	requiredPermission?: string | string[]
}

function AccessDenied() {
	return (
		<div className='flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center'>
			<ShieldAlert className='h-10 w-10 text-muted-foreground' />
			<h2 className='text-lg font-semibold'>Không có quyền truy cập</h2>
			<p className='text-muted-foreground'>
				Bạn không có quyền để xem nội dung này. Vui lòng liên hệ quản
				trị viên nếu cần hỗ trợ.
			</p>
		</div>
	)
}

export default function ProtectedRoute({
	children,
	fallback,
	redirectTo = '/login',
	requiredPermission
}: ProtectedRouteProps) {
	const { isAuthenticated, isAuthLoading, hasPermission } = useAuth()
	const location = useLocation()

	// Show loading spinner while checking auth
	if (isAuthLoading) {
		return fallback || <PageSkeleton />
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return (
			<Navigate
				to={redirectTo}
				search={{ redirect: location.pathname.toString() }}
				replace
			/>
		)
	}

	// Show an in-place access-denied message if the user lacks the
	// required permission tag(s)
	if (!hasPermission(requiredPermission)) {
		return <AccessDenied />
	}

	return <>{children}</>
}
