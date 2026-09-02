package entities

import (
	"database/sql/driver"
	"fmt"
)

// UnitLevel mirrors apps/api/schema/units.ts's UnitLevel: a stable set of
// names stored in the DB as a small signed integer (`value`), with the
// actual hierarchy order coming from position in unitLevelOrder below, not
// from the stored integer.
type UnitLevel string

const (
	UnitLevelCorps      UnitLevel = "corps"
	UnitLevelDivision   UnitLevel = "division"
	UnitLevelBrigade    UnitLevel = "brigade"
	UnitLevelRegiment   UnitLevel = "regiment"
	UnitLevelDepartment UnitLevel = "department"
	UnitLevelBattalion  UnitLevel = "battalion"
	UnitLevelCompany    UnitLevel = "company"
	UnitLevelPlatoon    UnitLevel = "platoon"
	UnitLevelSquad      UnitLevel = "squad"
)

// unitLevelValues are the exact stable codes assigned in units.ts — never
// renumber these, existing rows decode against them.
var unitLevelValues = map[UnitLevel]int64{
	UnitLevelCorps:      -4,
	UnitLevelDivision:   -3,
	UnitLevelBrigade:    -2,
	UnitLevelRegiment:   -1,
	UnitLevelDepartment: 4,
	UnitLevelBattalion:  0,
	UnitLevelCompany:    1,
	UnitLevelPlatoon:    2,
	UnitLevelSquad:      3,
}

func (l UnitLevel) Valid() bool {
	_, ok := unitLevelValues[l]
	return ok
}

// unitLevelOrder defines the hierarchy, largest unit first — mirrors
// apps/api/schema/units.ts's UnitLevel.values. Rank is this slice's index,
// not the stored `value` above; a lower rank means a larger unit.
var unitLevelOrder = []UnitLevel{
	UnitLevelCorps,
	UnitLevelDivision,
	UnitLevelBrigade,
	UnitLevelRegiment,
	UnitLevelDepartment,
	UnitLevelBattalion,
	UnitLevelCompany,
	UnitLevelPlatoon,
	UnitLevelSquad,
}

// Rank returns the level's position in unitLevelOrder, or -1 if invalid.
func (l UnitLevel) Rank() int {
	for i, v := range unitLevelOrder {
		if v == l {
			return i
		}
	}
	return -1
}

// IsCompanyOrAbove mirrors controller.ts's isCompanyOrAbove: true when this
// level is Company or any larger (lower-ranked) level.
func (l UnitLevel) IsCompanyOrAbove() bool {
	return l.Rank() >= 0 && l.Rank() <= UnitLevelCompany.Rank()
}

// Value implements driver.Valuer: the DB column is an integer, not the name.
func (l UnitLevel) Value() (driver.Value, error) {
	v, ok := unitLevelValues[l]
	if !ok {
		return nil, fmt.Errorf("unit level: invalid name %q", l)
	}
	return v, nil
}

// Scan implements sql.Scanner, decoding the stored integer back to a name.
func (l *UnitLevel) Scan(src any) error {
	if src == nil {
		*l = ""
		return nil
	}

	var n int64
	switch v := src.(type) {
	case int64:
		n = v
	case int32:
		n = int64(v)
	case int:
		n = int64(v)
	default:
		return fmt.Errorf("unit level: unsupported scan type %T", src)
	}

	for name, val := range unitLevelValues {
		if val == n {
			*l = name
			return nil
		}
	}
	return fmt.Errorf("unit level: unknown value %d", n)
}

// Unit mirrors apps/api/schema/units.ts's units table.
type Unit struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Alias string    `db:"alias" json:"alias"`
	Name  string    `db:"name" json:"name"`
	Level UnitLevel `db:"level" json:"level"`

	ParentID *int64 `db:"parentId" json:"parentId"`

	CommanderID                *int64 `db:"commanderId" json:"commanderId"`
	DeputyCommanderID          *int64 `db:"deputyCommanderId" json:"deputyCommanderId"`
	PoliticalCommanderID       *int64 `db:"politicalCommanderId" json:"politicalCommanderId"`
	DeputyPoliticalCommanderID *int64 `db:"deputyPoliticalCommanderId" json:"deputyPoliticalCommanderId"`
}

func (Unit) TableName() string { return "units" }
