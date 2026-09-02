package entities

// Permission mirrors apps/api/schema/permissions.ts's permissions table.
type Permission struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name        string  `db:"name" json:"name"`
	DisplayName string  `db:"display_name" json:"displayName"`
	Description *string `db:"description" json:"description"`

	ResourceID int64 `db:"resource_id" json:"resourceId"`
	ActionID   int64 `db:"action_id" json:"actionId"`
}

func (Permission) TableName() string { return "permissions" }
