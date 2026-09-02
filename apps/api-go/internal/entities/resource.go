package entities

// Resource mirrors apps/api/schema/resources.ts's resources table.
type Resource struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name        string  `db:"name" json:"name"`
	DisplayName string  `db:"display_name" json:"displayName"`
	Description *string `db:"description" json:"description"`
}

func (Resource) TableName() string { return "resources" }
