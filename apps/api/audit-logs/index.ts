import {
	AuditLog,
	AuditLogDB,
	AuditLogParams,
	AuditLogQuery
} from '../schema/audit-logs'

export interface AuditLogRepository {
	create(params: AuditLogParams): Promise<AuditLogDB>
	find(query: AuditLogQuery): Promise<{ data: AuditLog[]; total: number }>
}
