package entities

// Room mirrors apps/api/schema/rooms.ts's rooms table.
type Room struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	UnitID      int64   `db:"unitId" json:"unitId"`
	BuildingID  *int64  `db:"buildingId" json:"buildingId"`
	Name        string  `db:"name" json:"name"`
	Type        *string `db:"type" json:"type"`
	Description *string `db:"description" json:"description"`
}

func (Room) TableName() string { return "rooms" }
