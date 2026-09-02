package entities

// NotificationType mirrors apps/api/schema/notifications.ts's
// NotificationTypeEnum.
type NotificationType string

const (
	NotificationTypeBirthday    NotificationType = "birthday"
	NotificationTypeOfficialCpv NotificationType = "officialCpv"
)

func (t NotificationType) Valid() bool {
	switch t {
	case NotificationTypeBirthday, NotificationTypeOfficialCpv:
		return true
	default:
		return false
	}
}

// Notification mirrors apps/api/schema/notifications.ts's notifications
// table. Its primary key is a client-generated UUID (see internal/idgen),
// not an autoincrement integer like every other entity in this app.
type Notification struct {
	ID        string  `db:"pk" json:"id"`
	CreatedAt string  `db:"createdAt" json:"createdAt"`
	ReadAt    *string `db:"readAt" json:"readAt"`

	NotificationType NotificationType `db:"notificationType" json:"notificationType"`
	Title            string           `db:"title" json:"title"`
	Message          string           `db:"message" json:"message"`

	IsBatch    bool    `db:"isBatch" json:"isBatch"`
	BatchKey   *string `db:"batchKey" json:"batchKey"`
	TotalCount int     `db:"totalCount" json:"totalCount"`

	RecipientID *int64 `db:"recipientId" json:"recipientId"`
	ActorID     *int64 `db:"actorId" json:"actorId"`
}

func (Notification) TableName() string { return "notifications" }
