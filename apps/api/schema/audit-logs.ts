import { InferInsertModel, InferSelectModel, relations, sql } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { AppError } from '../errors'
import { baseSchema } from './base'
import { users } from './users'

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject'

const auditActions: AuditAction[] = [
	'create',
	'update',
	'delete',
	'approve',
	'reject'
]

const AuditActionEnum = sqlite.customType<{
	data: string
	driverData: string
}>({
	dataType() {
		return 'text'
	},
	toDriver(val: string) {
		if (!auditActions.includes(val as AuditAction)) {
			throw AppError.invalidArgument(
				`action must be one of ${auditActions.join(', ')}`
			)
		}
		return val
	}
})

export const auditLogs = sqlite.sqliteTable('audit_logs', {
	...baseSchema,
	actorUserId: sqlite.int().references(() => users.id),
	resource: sqlite.text().notNull(),
	action: AuditActionEnum('action').$type<AuditAction>().notNull(),
	resourceIds: sqlite
		.text({ mode: 'json' })
		.default(sql`'[]'`)
		.$type<Array<number | string>>(),
	method: sqlite.text().notNull(),
	path: sqlite.text().notNull(),
	statusCode: sqlite.int(),
	previousValue: sqlite
		.text({ mode: 'json' })
		.default(sql`'{}'`)
		.$type<unknown>(),
	newValue: sqlite
		.text({ mode: 'json' })
		.default(sql`'{}'`)
		.$type<unknown>()
})

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	actor: one(users, {
		fields: [auditLogs.actorUserId],
		references: [users.id]
	})
}))

export type AuditLogDB = InferSelectModel<typeof auditLogs>

export type AuditLogParams = InferInsertModel<typeof auditLogs>

type auditLogRow = Omit<AuditLogDB, 'actorUserId'>

export type AuditLog = auditLogRow & {
	actor?: { id: number; displayName?: string } | null
}

export type AuditLogQuery = {
	resource?: string
	action?: AuditAction
	actorUserId?: number
	from?: string
	to?: string
	page?: number
	pageSize?: number
}
