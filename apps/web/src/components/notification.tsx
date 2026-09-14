import { MarkAsRead } from '@/api'
import useUnreadNotificationCount from '@/hooks/useUnreadNotificationCount'
import { formatTimestamp } from '@/lib/utils'
import type { AppNotification, AppNotificationType } from '@/types'
import { useMutation } from '@tanstack/react-query'
import { Link, type LinkProps } from '@tanstack/react-router'
import { Cake, UserRoundCheck } from 'lucide-react'

export type NotificationProps = {
	notification: AppNotification
	onClick?: () => void
}

const getNotificationIcon = (type: AppNotificationType) => {
	switch (type) {
		case 'officialCpv':
			return <UserRoundCheck size={16} />
		case 'birthday':
			return <Cake size={16} />
		default:
			return '🔔'
	}
}

// Where clicking a notification of each type should navigate. commanderDigest
// has no dedicated page in this app (it's an emailed/exported report), so it
// falls back to the dashboard rather than reusing an unrelated route.
const NOTIFICATION_ROUTES: Record<AppNotificationType, LinkProps['to']> = {
	birthday: '/birthday',
	officialCpv: '/chuyen-dang-chinh-thuc',
	activityStatusProposal: '/de-xuat-che-do',
	rankPromotionProposal: '/de-xuat-thang-quan-ham',
	commanderDigest: '/'
}

export default function Notification({
	notification,
	onClick
}: NotificationProps) {
	const { refetch: refetchUnreadNotification } = useUnreadNotificationCount()
	const { mutate } = useMutation({
		mutationFn: MarkAsRead,
		onSuccess: () => {
			refetchUnreadNotification()
		},
		onError: (err) => {
			console.error('MarkAsRead error: ', err)
		}
	})

	function handleReadNotification() {
		if (notification.readAt !== null) {
			onClick?.()
			return
		}

		if (notification.id === undefined) {
			console.log(
				'Notification.handleReadNotification: Notification id is undefined'
			)
		} else {
			mutate({ ids: [notification.id] })
		}

		onClick?.()
	}

	const to = NOTIFICATION_ROUTES[notification.notificationType] ?? '/'

	return (
		<Link to={to} onClick={handleReadNotification}>
			<div
				className={`p-4 hover:bg-gray-50 transition-colors ${
					!notification.readAt === null ? 'bg-blue-50' : ''
				}`}
			>
				<div className='flex flex-col gap-2 space-x-3'>
					<div className='flex gap-2'>
						<div className='bg-white rounded-full p-1'>
							<span className='text-xs'>
								{getNotificationIcon(
									notification.notificationType
								)}
							</span>
						</div>
						{notification.title}
					</div>
					<div className='flex-1 min-w-0'>
						<p className='text-sm'>
							<span className='font-medium'>
								{notification.message}
							</span>
						</p>
						<p className='text-xs text-gray-500 mt-1'>
							{formatTimestamp(notification.createdAt)}
						</p>
					</div>
					{!notification.readAt && (
						<div className='w-2 h-2 bg-blue-500 rounded-full mt-2' />
					)}
				</div>
			</div>
		</Link>
	)
}
