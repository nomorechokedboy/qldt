package materialstocks

import (
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateMaterialStockInput struct {
	MaterialTypeID int64  `json:"materialTypeId"`
	UnitID         int64  `json:"unitId"`
	RoomID         *int64 `json:"roomId,omitempty"`
	Quantity       int64  `json:"quantity,omitempty"`
	Condition      string `json:"condition,omitempty"`
}

func (in CreateMaterialStockInput) toEntity() *entities.MaterialStock {
	condition := entities.MaterialCondition(in.Condition)
	if condition == "" {
		condition = entities.MaterialConditionGood
	}

	return &entities.MaterialStock{
		MaterialTypeID: in.MaterialTypeID,
		UnitID:         in.UnitID,
		RoomID:         in.RoomID,
		Quantity:       in.Quantity,
		Condition:      condition,
	}
}

var updatableColumns = map[string]bool{
	"materialTypeId": true, "unitId": true, "roomId": true, "quantity": true, "condition": true,
}

func toUpdateParams(data map[string]any) (dbx.Params, error) {
	cols := dbx.Params{}
	for k, v := range data {
		if v == nil || !updatableColumns[k] {
			continue
		}

		if k == "condition" {
			name, ok := v.(string)
			if !ok {
				return nil, fmt.Errorf("material_stocks: condition must be a string")
			}
			if !entities.MaterialCondition(name).Valid() {
				return nil, fmt.Errorf("material_stocks: invalid condition %q", name)
			}
		}

		cols[k] = v
	}
	return cols, nil
}
