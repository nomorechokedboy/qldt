package entities

// Action mirrors apps/api/schema/actions.ts's actions table.
type Action struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name        string  `db:"name" json:"name"`
	DisplayName string  `db:"display_name" json:"displayName"`
	Description *string `db:"description" json:"description"`
}

func (Action) TableName() string { return "actions" }
