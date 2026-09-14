import { api } from 'encore.dev/api'
import notificationController from './controller'
import log from 'encore.dev/log'
import { Subscription } from 'encore.dev/pubsub'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import { notiTopic } from '../topics'
import NotificationBroadcaster from './broadcaster'

function requireActorUserId(): number {
	const authData = getAuthData()
	const actorUserId = authData?.userID ? Number(authData.userID) : undefined
	if (actorUserId === undefined) {
		throw AppError.handleAppErr(
			AppError.unauthenticated('Authentication required')
		)
	}
	return actorUserId
}

export interface GetNotificationsQuery {
	page?: number
	pageSize?: number
}

interface NotificationItemResponse {
	id: number
	createdAt: string
	updatedAt: string

	notifiableType: 'students'
	notifiableId: number

	notificationId: string
}

interface NotificationResponse {
	id: string
	createdAt: string
	readAt: string

	notificationType:
		| 'birthday'
		| 'officialCpv'
		| 'commanderDigest'
		| 'activityStatusProposal'
	title: string
	message: string

	isBatch: boolean
	batchKey: string
	totalCount: number

	items: Array<NotificationItemResponse>
}

interface GetNotificationsResponse {
	data: Array<NotificationResponse>
}

export const GetNotifications = api(
	{ expose: true, method: 'GET', path: '/notifications', auth: true },
	async (q: GetNotificationsQuery): Promise<GetNotificationsResponse> => {
		const actorUserId = requireActorUserId()
		const resp = await notificationController
			.find(q, actorUserId)
			.then((data) =>
				data.map(
					(n) =>
						({
							...n
						}) as NotificationResponse
				)
			)

		return { data: resp }
	}
)

interface MarkAsReadRequest {
	ids: Array<string>
}

export const MarkAsRead = api(
	{
		expose: true,
		method: 'PATCH',
		path: '/notifications/mark-as-read',
		auth: true
	},
	async ({ ids }: MarkAsReadRequest) => {
		const actorUserId = requireActorUserId()
		await notificationController.markAsRead(ids, actorUserId)

		return {}
	}
)

interface GetUnreadCountResponse {
	data: { count: number }
}

export const GetUnreadCount = api(
	{ expose: true, method: 'GET', path: '/notifications/unread', auth: true },
	async (): Promise<GetUnreadCountResponse> => {
		const actorUserId = requireActorUserId()
		const count = await notificationController.getUnreadCount(actorUserId)

		return { data: { count } }
	}
)

// The stream's recipient is derived from the authenticated actor, never from
// client-supplied data - so the handshake itself carries nothing.
interface Handshake {}

export interface Message {
	type:
		| 'ping'
		| 'birthdayThisWeek'
		| 'birthdayThisMonth'
		| 'birthdayThisQuarter'
		| 'cpvOfficialThisWeek'
		| 'cpvOfficialThisMonth'
		| 'cpvOfficialThisQuarter'
		| 'activityStatusProposal'
	data: { title: string; message: string; userId: number }
}

const notificationBroadcaster = new NotificationBroadcaster()

export const NotificationStream = api.streamOut<Handshake, Message>(
	{ expose: true, path: '/notifications/stream', auth: true },
	async (_handshake, stream) => {
		const actorUserId = requireActorUserId()
		log.trace(`Starting notification stream for user ${actorUserId}`)

		notificationBroadcaster.addStream(actorUserId, stream)

		try {
			log.trace('Starting heartbeat stream')

			// Keep the stream alive with heartbeats
			for await (const hb of heartbeatGenerator()) {
				const hbStr = hb.toString()
				await stream.send({
					type: 'ping',
					data: { message: hbStr, title: hbStr, userId: actorUserId }
				})
			}
		} catch (err) {
			log.error('Stream error:', err)
		} finally {
			notificationBroadcaster.handleStreamDisconnect(actorUserId, stream)
		}
	}
)

const _ = new Subscription(notiTopic, 'notification-processor', {
	handler: async (event) => {
		log.trace('Processing notification event', { event })

		// Use the broadcaster to send the message
		await notificationBroadcaster.sendToUser(event.userId, {
			type: event.type,
			data: {
				message: event.message,
				title: event.title,
				userId: event.userId
			}
		})
	}
})

async function* heartbeatGenerator(
	intervalMs: number = 25000,
	payload: string | Buffer = 'ping'
): AsyncGenerator<string | Buffer, never, unknown> {
	while (true) {
		yield payload
		await new Promise<void>((resolve) => setTimeout(resolve, intervalMs))
	}
}
