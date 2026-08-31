import log from 'encore.dev/log'
import { AuditLogRepository } from '.'
import { AppError } from '../errors'
import { AuditLog, AuditLogParams, AuditLogQuery } from '../schema/audit-logs'
import auditLogRepo from './repo'

class controller {
	constructor(private readonly repo: AuditLogRepository) {}

	create(params: AuditLogParams) {
		log.trace('AuditLogController.create params', { params })

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	find(query: AuditLogQuery): Promise<{ data: AuditLog[]; total: number }> {
		log.trace('AuditLogController.find query', { query })

		return this.repo.find(query).catch(AppError.handleAppErr)
	}
}

const auditLogController = new controller(auditLogRepo)

export default auditLogController
