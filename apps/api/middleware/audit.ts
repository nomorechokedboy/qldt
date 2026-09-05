import { APICallMeta, currentRequest } from 'encore.dev'
import { middleware } from 'encore.dev/api'
import log from 'encore.dev/log'
import { getAuthData } from '~encore/auth'
import { publishAuditEvent } from '../audit-logs/publish'
import { AuditAction } from '../schema/audit-logs'

interface AuditRouteConfig {
	resource: string
	action: AuditAction
}

// Which mutating routes get an audit_logs row, and how to label them.
// Add an entry here (and call setAuditContext from the matching handler)
// whenever a new resource needs to be audited.
const AUDIT_MAP: Record<string, AuditRouteConfig> = {
	'POST:/students': { resource: 'students', action: 'create' },
	'PATCH:/students': { resource: 'students', action: 'update' },
	'DELETE:/students': { resource: 'students', action: 'delete' },

	'POST:/material-assets': { resource: 'material_assets', action: 'create' },
	'PATCH:/material-assets': { resource: 'material_assets', action: 'update' },
	'DELETE:/material-assets': {
		resource: 'material_assets',
		action: 'delete'
	},

	'POST:/material-types': { resource: 'material_types', action: 'create' },
	'PATCH:/material-types': { resource: 'material_types', action: 'update' },
	'DELETE:/material-types': { resource: 'material_types', action: 'delete' },

	'POST:/material-stocks': { resource: 'material_stocks', action: 'create' },
	'PATCH:/material-stocks': { resource: 'material_stocks', action: 'update' },
	'DELETE:/material-stocks': {
		resource: 'material_stocks',
		action: 'delete'
	},

	'POST:/buildings': { resource: 'buildings', action: 'create' },
	'PATCH:/buildings': { resource: 'buildings', action: 'update' },
	'DELETE:/buildings': { resource: 'buildings', action: 'delete' },

	'POST:/rooms': { resource: 'rooms', action: 'create' },
	'PATCH:/rooms': { resource: 'rooms', action: 'update' },
	'DELETE:/rooms': { resource: 'rooms', action: 'delete' },

	'POST:/units': { resource: 'units', action: 'create' },
	'PATCH:/units': { resource: 'units', action: 'update' },
	'DELETE:/units': { resource: 'units', action: 'delete' },

	'POST:/roles': { resource: 'roles', action: 'create' },
	'PUT:/roles/:id': { resource: 'roles', action: 'update' },
	'DELETE:/roles': { resource: 'roles', action: 'delete' },

	'POST:/permissions': { resource: 'permissions', action: 'create' },

	'POST:/users': { resource: 'users', action: 'create' },
	'PUT:/users': { resource: 'users', action: 'update' },
	'DELETE:/users': { resource: 'users', action: 'delete' },

	'POST:/user-roles/assign': { resource: 'user_roles', action: 'update' },

	'POST:/export-templates': {
		resource: 'export_templates',
		action: 'create'
	},
	'DELETE:/export-templates/:id': {
		resource: 'export_templates',
		action: 'delete'
	},

	'POST:/transfer-requests': {
		resource: 'transfer_requests',
		action: 'create'
	},
	'POST:/transfer-requests/:id/approve': {
		resource: 'transfer_requests',
		action: 'approve'
	},
	'POST:/transfer-requests/:id/reject': {
		resource: 'transfer_requests',
		action: 'reject'
	},
	'POST:/transfer-requests/:id/cancel': {
		resource: 'transfer_requests',
		action: 'update'
	}
}

function matchAuditRoute(
	method: string,
	path: string
): AuditRouteConfig | undefined {
	const key = `${method}:${path}`
	if (AUDIT_MAP[key]) {
		return AUDIT_MAP[key]
	}

	for (const [pattern, config] of Object.entries(AUDIT_MAP)) {
		// Route paths can contain params (":id"), so only split on the first
		// colon - a naive pattern.split(':') truncates "/transfer-requests/:id/approve"
		// down to just "/transfer-requests", silently breaking the regex match below.
		const sepIndex = pattern.indexOf(':')
		const patternMethod = pattern.slice(0, sepIndex)
		const patternPath = pattern.slice(sepIndex + 1)
		if (method !== patternMethod) continue

		const regexPattern = patternPath
			.replace(/:\w+/g, '[^/]+')
			.replace(/\*/g, '.*')
		const regex = new RegExp(`^${regexPattern}$`)
		if (regex.test(path)) {
			return config
		}
	}

	return undefined
}

interface AuditContext {
	resourceIds: Array<number | string>
	previousValue?: unknown
	newValue?: unknown
}

// Handlers pass raw domain objects (often with nested Drizzle relations,
// e.g. transfer_requests.approver: UserDB) into setAuditContext. Rather than
// trust every call site to pre-sanitize, strip sensitive keys here — the one
// place all of them funnel through before the value is persisted.
const SENSITIVE_KEYS = new Set(['password'])

function sanitizeAuditValue(value: unknown, seen = new WeakSet()): unknown {
	if (Array.isArray(value)) {
		return value.map((v) => sanitizeAuditValue(v, seen))
	}
	if (value !== null && typeof value === 'object') {
		if (seen.has(value)) return undefined
		seen.add(value)
		const out: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(value)) {
			if (SENSITIVE_KEYS.has(key)) continue
			out[key] = sanitizeAuditValue(val, seen)
		}
		return out
	}
	return value
}

// Extend the middleware data type
declare module 'encore.dev/api' {
	interface MiddlewareData {
		audit?: AuditContext
	}
}

/**
 * Handlers for audited routes call this before returning, so the audit
 * middleware (which cannot see the parsed request body of typed endpoints)
 * has something to log besides the generic envelope. `req.data` set here is
 * the same object exposed to the handler as `currentRequest().middlewareData`,
 * so the write is visible back in the middleware after `next()` resolves.
 */
export function setAuditContext(context: AuditContext) {
	const callMeta = currentRequest() as APICallMeta
	if (callMeta.middlewareData) {
		callMeta.middlewareData.audit = context
	}
}

export const auditMiddleware = middleware(
	{ target: { auth: true } },
	async (req, next) => {
		const meta = req.requestMeta as APICallMeta | undefined
		const config = meta && matchAuditRoute(meta.method, meta.path)

		const resp = await next(req)

		if (!config || !meta) {
			return resp
		}

		const audit = req.data.audit as AuditContext | undefined

		// Handler never called setAuditContext (e.g. bulk op touched nothing) —
		// nothing to write, so skip publishing entirely.
		if (!audit) {
			return resp
		}

		const authData = getAuthData()
		const actorUserId = authData?.userID
			? Number(authData.userID)
			: undefined

		// HandlerResponse.status is write-only (for overriding the status code),
		// so there's nothing to read here. We only reach this point when next()
		// resolved without throwing, i.e. a successful request.
		//
		// The actual DB write happens out-of-band in the audit-logs service's
		// subscription (audit-logs/subscription.ts), which processes this topic
		// on its own goroutine/process rather than inline in the request path.
		publishAuditEvent({
			actorUserId,
			resource: config.resource,
			action: config.action,
			resourceIds: audit.resourceIds ?? [],
			method: meta.method,
			path: meta.path,
			statusCode: 200,
			previousValue: sanitizeAuditValue(audit.previousValue),
			newValue: sanitizeAuditValue(audit.newValue)
		}).catch((err) => {
			log.error('auditMiddleware: failed to publish audit log event', {
				err
			})
		})

		return resp
	}
)
