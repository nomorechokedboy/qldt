package entities

// ClassStatus mirrors apps/api/schema/classes.ts's StatusEnum.
type ClassStatus string

const (
	ClassStatusOngoing   ClassStatus = "ongoing"
	ClassStatusGraduated ClassStatus = "graduated"
)

// Class mirrors apps/api/schema/classes.ts's classes table.
type Class struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name        string      `db:"name" json:"name"`
	Description string      `db:"description" json:"description"`
	GraduatedAt *string     `db:"graduatedAt" json:"graduatedAt"`
	Status      ClassStatus `db:"status" json:"status"`
	UnitID      int64       `db:"unitId" json:"unitId"`
}

func (Class) TableName() string { return "classes" }
