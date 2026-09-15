import {
	Outlet,
	createRootRouteWithContext,
	useNavigate
} from '@tanstack/react-router'
import useAuth from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import Header from '../components/Header'
import TanStackQueryLayout from '../integrations/tanstack-query/layout'
import { type QueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import type { notifications, StreamIn } from '@/api/client'
import { useEffectOnce } from 'react-use'
import { requestClient } from '@/api'
import useInfiniteNotification from '@/hooks/useInfiniteNotification'
import useUnreadNotificationCount from '@/hooks/useUnreadNotificationCount'
import Cdhc2Logo from '@/assets/artillery-icon.png'
import useIsInitAdmin from '@/hooks/useIsInitAdmin'
import useIsInitRootUnit from '@/hooks/useIsInitRootUnit'
import useUnitsData from '@/hooks/useUnitsData'
import { useLocation } from '@tanstack/react-router'

interface MyRouterContext {
	queryClient: QueryClient
}

function RootLayout() {
	const navigate = useNavigate()
	const { isAuthenticated, user } = useAuth()
	const { refetch: refetchNotifications } = useInfiniteNotification()
	const { refetch: refetchUnreadNoti } = useUnreadNotificationCount()
	const streamRef = useRef<StreamIn<notifications.Message>>(null)
	const { data: isInitAdmin } = useIsInitAdmin()
	const { data: rootUnitStatus } = useIsInitRootUnit()
	const location = useLocation()

	const { data: units, isLoading: isUnitsLoading } = useUnitsData(undefined, {
		enabled: isAuthenticated && isInitAdmin === true
	})

	useEffect(() => {
		if (
			rootUnitStatus?.initialized === false &&
			location.pathname !== '/khoi-tao-don-vi'
		) {
			navigate({ to: '/khoi-tao-don-vi', replace: true })
		} else if (
			rootUnitStatus?.initialized === true &&
			isInitAdmin === false &&
			location.pathname !== '/khoi-tao-qtv'
		) {
			navigate({ to: '/khoi-tao-qtv', replace: true })
		} else if (
			isAuthenticated &&
			user?.isSuperAdmin === true &&
			isInitAdmin === true &&
			!isUnitsLoading &&
			units !== undefined &&
			units.length === 0 &&
			location.pathname !== '/khoi-tao-don-vi'
		) {
			// Only super admins get bounced here on an empty unit list - it's a
			// recovery path for "every unit was deleted after setup". Regular
			// users are scoped to their own unit's subtree (see authzMiddleware's
			// validUnitIds), so an empty result for them just means their account
			// isn't assigned to a unit (or lost access) - not that the app itself
			// needs re-onboarding. Treating that the same way used to force
			// every such user back to the root-unit wizard on every navigation.
			navigate({ to: '/khoi-tao-don-vi', replace: true })
		}
	}, [
		rootUnitStatus,
		isInitAdmin,
		isAuthenticated,
		user?.isSuperAdmin,
		isUnitsLoading,
		units,
		location.pathname,
		navigate
	])

	function handleRefreshNoti() {
		refetchUnreadNoti()
		refetchNotifications()
	}

	function createWebNotification({
		message,
		title,
		icon = Cdhc2Logo
	}: {
		title: string
		message: string
		icon?: string
	}) {
		if (window.Notification && Notification.permission === 'granted') {
			new Notification(title, {
				body: message,
				icon
			})
		}
	}

	async function setupStream() {
		try {
			const stream = await requestClient.notifications.NotificationStream(
				{}
			)

			streamRef.current = stream

			stream.socket.on('open', () => {
				console.log('Notification stream connected')
			})

			stream.socket.on('close', () => {
				console.log('Notification stream disconnected')
			})

			stream.socket.on('error', (error: any) => {
				console.error('Notification stream error:', error)
			})

			for await (const notificationEvent of stream) {
				if (notificationEvent.type === 'ping') {
					continue
				}

				console.log('Received notification:', notificationEvent)
				handleRefreshNoti()
				createWebNotification({
					title: notificationEvent.data.title,
					message: notificationEvent.data.message
				})
			}
		} catch (err) {
			console.error('Failed to start stream', err)
		}
	}

	const stopNotificationStream = () => {
		if (streamRef.current) {
			streamRef.current.socket.close()
			streamRef.current = null
		}
	}

	useEffectOnce(() => {
		if (isAuthenticated !== true) {
			return
		}

		setupStream()

		return () => {
			stopNotificationStream()
		}
	})

	return (
		<>
			<SidebarProvider>
				{isAuthenticated && <AppSidebar collapsible='icon' />}
				<Toaster richColors position='top-center' />
				<div className='flex flex-col w-full'>
					{isAuthenticated && <Header />}
					<Outlet />
				</div>
			</SidebarProvider>
			{import.meta.env.PROD !== true && (
				<TanstackDevtools
					config={{ position: 'bottom-left' }}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtools />
						},
						TanStackQueryDevtools
					]}
				/>
			)}
			<TanStackQueryLayout />
		</>
	)
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout
})
