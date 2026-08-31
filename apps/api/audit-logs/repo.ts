import { and, count, desc, eq, gte, lte, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { AuditLogRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	AuditLog,
	AuditLogDB,
	AuditLogParams,
	AuditLogQuery,
	auditLogs
} from '../schema/audit-logs'
import { handleDatabaseErr } from '../utils'

const DEFAULT_PAGE_SIZE = 20

class repo implements AuditLogRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: AuditLogParams): Promise<AuditLogDB> {
		log.info('AuditLogRepo.create params: ', { params })
		return this.db
			.insert(auditLogs)
			.values(params)
			.returning()
			.then((rows) => rows[0])
			.catch(handleDatabaseErr)
	}

	async find(
		query: AuditLogQuery
	): Promise<{ data: AuditLog[]; total: number }> {
		const conditions: SQL[] = []
		if (query.resource !== undefined) {
			conditions.push(eq(auditLogs.resource, query.resource))
		}
		if (query.action !== undefined) {
			conditions.push(eq(auditLogs.action, query.action))
		}
		if (query.actorUserId !== undefined) {
			conditions.push(eq(auditLogs.actorUserId, query.actorUserId))
		}
		if (query.from !== undefined) {
			conditions.push(gte(auditLogs.createdAt, query.from))
		}
		if (query.to !== undefined) {
			conditions.push(lte(auditLogs.createdAt, query.to))
		}

		const where = conditions.length === 0 ? undefined : and(...conditions)

		const page = query.page && query.page > 0 ? query.page : 1
		const pageSize =
			query.pageSize && query.pageSize > 0
				? query.pageSize
				: DEFAULT_PAGE_SIZE

		const [data, totalResult] = await Promise.all([
			this.db.query.auditLogs.findMany({
				where,
				with: { actor: true },
				orderBy: desc(auditLogs.createdAt),
				limit: pageSize,
				offset: (page - 1) * pageSize
			}),
			this.db.select({ total: count() }).from(auditLogs).where(where)
		]).catch(handleDatabaseErr)

		return {
			data: data as unknown as AuditLog[],
			total: totalResult[0]?.total ?? 0
		}
	}
}

const auditLogRepo = new repo(orm)

export default auditLogRepo
