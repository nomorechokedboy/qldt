import { Topic } from 'encore.dev/pubsub'
import { AuditAction } from '../schema/audit-logs'

export interface AuditLogEvent {
	actorUserId?: number
	resource: string
	action: AuditAction
	resourceIds: Array<number | string>
	method: string
	path: string
	statusCode?: number
	previousValue?: unknown
	newValue?: unknown
}

export const auditLogTopic = new Topic<AuditLogEvent>('audit-log-events', {
	deliveryGuarantee: 'at-least-once'
})

export interface NotificationEvent {
	userId: number
	title: string
	message: string
	type:
		| 'birthdayThisWeek'
		| 'birthdayThisMonth'
		| 'birthdayThisQuarter'
		| 'cpvOfficialThisWeek'
		| 'cpvOfficialThisMonth'
		| 'cpvOfficialThisQuarter'
}

export const notiTopic = new Topic<NotificationEvent>('notification-events', {
	deliveryGuarantee: 'at-least-once'
})
