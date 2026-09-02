package entities

// NotifiableType mirrors apps/api/schema/notification-items.ts's
// ResourcesEnum — the polymorphic target of a notification item.
type NotifiableType string

const (
	NotifiableClasses  NotifiableType = "classes"
	NotifiableStudents NotifiableType = "students"
)

func (t NotifiableType) Valid() bool {
	switch t {
	case NotifiableClasses, NotifiableStudents:
		return true
	default:
		return false
	}
}

// NotificationItem mirrors apps/api/schema/notification-items.ts's
// notification_items table — one polymorphic (student/class) target of a
// batch notification.
type NotificationItem struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	NotifiableType NotifiableType `db:"notifiableType" json:"notifiableType"`
	NotifiableID   int64          `db:"notifiableId" json:"notifiableId"`
	NotificationID string         `db:"notificationId" json:"notificationId"`
}

func (NotificationItem) TableName() string { return "notification_items" }
