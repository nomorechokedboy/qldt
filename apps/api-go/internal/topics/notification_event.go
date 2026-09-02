package topics

import "encore.dev/pubsub"

// NotificationEventType mirrors apps/api/topics/index.ts's
// NotificationEvent['type'].
type NotificationEventType string

const (
	NotificationEventBirthdayThisWeek       NotificationEventType = "birthdayThisWeek"
	NotificationEventBirthdayThisMonth      NotificationEventType = "birthdayThisMonth"
	NotificationEventBirthdayThisQuarter    NotificationEventType = "birthdayThisQuarter"
	NotificationEventCpvOfficialThisWeek    NotificationEventType = "cpvOfficialThisWeek"
	NotificationEventCpvOfficialThisMonth   NotificationEventType = "cpvOfficialThisMonth"
	NotificationEventCpvOfficialThisQuarter NotificationEventType = "cpvOfficialThisQuarter"
)

// NotificationEvent mirrors apps/api/topics/index.ts's NotificationEvent —
// published whenever a notification should be pushed live to a connected
// user, on top of the row already written via the notifications repo.
type NotificationEvent struct {
	UserID  int64
	Title   string
	Message string
	Type    NotificationEventType
}

var NotificationTopic = pubsub.NewTopic[*NotificationEvent]("notification-events", pubsub.TopicConfig{
	DeliveryGuarantee: pubsub.AtLeastOnce,
})
