import log from 'encore.dev/log'
import { Subscription } from 'encore.dev/pubsub'
import { auditLogTopic } from '../topics'
import auditLogController from './controller'

// Encore runs each topic's subscribers on Encore's own goroutine/worker
// pool, outside the request-handling call stack of whichever handler
// published the event — this is what decouples the audit_logs write from
// the request path (see middleware/audit.ts).
const _ = new Subscription(auditLogTopic, 'audit-log-writer', {
	handler: async (event) => {
		log.trace('Processing audit log event', { event })

		await auditLogController.create(event)
	}
})
