import { auditLogTopic, AuditLogEvent } from '../topics'

// Wraps the topic publish call so Encore's static analyzer can attribute it
// to a single service (audit_logs). auditMiddleware lives under middleware/,
// which isn't owned by any one service, so it can't call `.publish()`
// directly on a shared topic.
export function publishAuditEvent(event: AuditLogEvent) {
	return auditLogTopic.publish(event)
}
