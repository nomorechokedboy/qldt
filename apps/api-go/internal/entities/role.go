package entities

// Role mirrors apps/api/schema/roles.ts's roles table.
type Role struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name        string  `db:"name" json:"name"`
	Description *string `db:"description" json:"description"`
}

func (Role) TableName() string { return "roles" }
