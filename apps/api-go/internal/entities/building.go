package entities

// Building mirrors apps/api/schema/buildings.ts's buildings table.
type Building struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	UnitID      int64   `db:"unitId" json:"unitId"`
	Name        string  `db:"name" json:"name"`
	Description *string `db:"description" json:"description"`
}

func (Building) TableName() string { return "buildings" }
