import log from 'encore.dev/log'
import { NotificationEvent, notiTopic } from '../topics'
import notificationController from './controller'

// Fire-and-forget notification for any "raise a request, someone else
// decides" feature (activity-status-proposals, and future ones following
// the same pattern): delivery must never block or fail the caller's main
// request, so every failure is caught and logged here rather than
// propagated. `notificationType` must already be a member of the DB's
// NotificationTypeEnum (schema/notifications.ts) and `pushType` a member of
// NotificationEvent['type'] (topics/index.ts) — both need extending
// alongside a new feature the first time it starts sending notifications.
export function notifyUser(
	recipientId: number,
	notificationType: string,
	pushType: NotificationEvent['type'],
	title: string,
	message: string
): void {
	void notificationController
		.create([{ notificationType, title, message, recipientId }])
		.then(() => {
			notiTopic.publish({
				userId: recipientId,
				title,
				message,
				type: pushType
			})
		})
		.catch((err) => {
			log.error('notifyUser failed', {
				err,
				recipientId,
				notificationType,
				title
			})
		})
}
