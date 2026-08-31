import { api, Query } from 'encore.dev/api'
import { AuditAction } from '../schema/audit-logs'
import auditLogController from './controller'

export interface GetAuditLogsQuery {
	resource?: Query<string>
	action?: Query<AuditAction>
	actorUserId?: Query<number>
	from?: Query<string>
	to?: Query<string>
	page?: Query<number>
	pageSize?: Query<number>
}

interface AuditLogResponse {
	id: number
	createdAt: string
	updatedAt: string
	resource: string
	action: AuditAction
	resourceIds: Array<number | string>
	method: string
	path: string
	statusCode: number | null
	previousValue: unknown
	newValue: unknown
	actor?: { id: number; displayName?: string } | null
}

interface GetAuditLogsResponse {
	data: AuditLogResponse[]
	total: number
}

export const GetAuditLogs = api(
	{ auth: true, expose: true, method: 'GET', path: '/audit-logs' },
	async (q: GetAuditLogsQuery): Promise<GetAuditLogsResponse> => {
		const { data, total } = await auditLogController.find({
			...q,
			action: q.action as AuditAction | undefined
		})

		return {
			data: data.map((l) => ({ ...l }) as AuditLogResponse),
			total
		}
	}
)
