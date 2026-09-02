// Package topics holds pubsub topics shared across services, mirroring
// apps/api/topics/index.ts. It lives outside any one service's directory —
// like AuditLogTopic below — because it's published to by the audit
// middleware (which isn't owned by any single service) and subscribed to by
// internal/auditlogs.
package topics

import (
	"encore.app/internal/entities"
	"encore.dev/pubsub"
)

// AuditLogEvent mirrors apps/api/topics/index.ts's AuditLogEvent.
// ResourceIds/PreviousValue/NewValue are pre-marshaled JSON (entities.JSONText)
// rather than `any` — Encore's static schema analyzer requires pubsub
// payload fields to have a concrete type, `interface{}` isn't supported.
type AuditLogEvent struct {
	ActorUserID   *int64
	Resource      string
	Action        string
	ResourceIds   entities.JSONText
	Method        string
	Path          string
	StatusCode    *int
	PreviousValue entities.JSONText
	NewValue      entities.JSONText
}

var AuditLogTopic = pubsub.NewTopic[*AuditLogEvent]("audit-log-events", pubsub.TopicConfig{
	DeliveryGuarantee: pubsub.AtLeastOnce,
})
