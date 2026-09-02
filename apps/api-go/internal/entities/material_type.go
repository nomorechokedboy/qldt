package entities

// MaterialCategory mirrors apps/api/schema/material-types.ts's
// MaterialCategoryName.
type MaterialCategory string

const (
	MaterialCategoryFurniture MaterialCategory = "furniture"
	MaterialCategoryEquipment MaterialCategory = "equipment"
	MaterialCategoryWeapon    MaterialCategory = "weapon"
	MaterialCategoryVehicle   MaterialCategory = "vehicle"
)

func (c MaterialCategory) Valid() bool {
	switch c {
	case MaterialCategoryFurniture, MaterialCategoryEquipment, MaterialCategoryWeapon, MaterialCategoryVehicle:
		return true
	default:
		return false
	}
}

// MaterialType mirrors apps/api/schema/material-types.ts's material_types
// table.
type MaterialType struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name          string           `db:"name" json:"name"`
	Category      MaterialCategory `db:"category" json:"category"`
	UnitOfMeasure *string          `db:"unitOfMeasure" json:"unitOfMeasure"`
	IsSerialized  bool             `db:"isSerialized" json:"isSerialized"`
}

func (MaterialType) TableName() string { return "material_types" }
