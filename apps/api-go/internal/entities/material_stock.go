package entities

// MaterialCondition mirrors apps/api/schema/material-stocks.ts's
// MaterialConditionName, shared with material_assets.
type MaterialCondition string

const (
	MaterialConditionGood             MaterialCondition = "good"
	MaterialConditionFair             MaterialCondition = "fair"
	MaterialConditionNeedsMaintenance MaterialCondition = "needs_maintenance"
	MaterialConditionDamaged          MaterialCondition = "damaged"
)

func (c MaterialCondition) Valid() bool {
	switch c {
	case MaterialConditionGood, MaterialConditionFair, MaterialConditionNeedsMaintenance, MaterialConditionDamaged:
		return true
	default:
		return false
	}
}

// MaterialStock mirrors apps/api/schema/material-stocks.ts's
// material_stocks table.
type MaterialStock struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	MaterialTypeID int64             `db:"materialTypeId" json:"materialTypeId"`
	UnitID         int64             `db:"unitId" json:"unitId"`
	RoomID         *int64            `db:"roomId" json:"roomId"`
	Quantity       int64             `db:"quantity" json:"quantity"`
	Condition      MaterialCondition `db:"condition" json:"condition"`
}

func (MaterialStock) TableName() string { return "material_stocks" }
