package entities

// MaterialAssetStatus mirrors apps/api/schema/material-assets.ts's
// MaterialAssetStatus.
type MaterialAssetStatus string

const (
	MaterialAssetStatusInService MaterialAssetStatus = "in_service"
	MaterialAssetStatusDamaged   MaterialAssetStatus = "damaged"
	MaterialAssetStatusLost      MaterialAssetStatus = "lost"
	MaterialAssetStatusRetired   MaterialAssetStatus = "retired"
)

func (s MaterialAssetStatus) Valid() bool {
	switch s {
	case MaterialAssetStatusInService, MaterialAssetStatusDamaged, MaterialAssetStatusLost, MaterialAssetStatusRetired:
		return true
	default:
		return false
	}
}

// MaterialAsset mirrors apps/api/schema/material-assets.ts's
// material_assets table.
type MaterialAsset struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	MaterialTypeID    int64               `db:"materialTypeId" json:"materialTypeId"`
	UnitID            int64               `db:"unitId" json:"unitId"`
	RoomID            *int64              `db:"roomId" json:"roomId"`
	SerialNumber      string              `db:"serialNumber" json:"serialNumber"`
	Condition         MaterialCondition   `db:"condition" json:"condition"`
	Status            MaterialAssetStatus `db:"status" json:"status"`
	AssignedTrooperID *int64              `db:"assignedTrooperId" json:"assignedTrooperId"`
}

func (MaterialAsset) TableName() string { return "material_assets" }
