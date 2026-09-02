package materialassets

import (
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateMaterialAssetInput struct {
	MaterialTypeID    int64  `json:"materialTypeId"`
	UnitID            int64  `json:"unitId"`
	RoomID            *int64 `json:"roomId,omitempty"`
	SerialNumber      string `json:"serialNumber"`
	Condition         string `json:"condition,omitempty"`
	Status            string `json:"status,omitempty"`
	AssignedTrooperID *int64 `json:"assignedTrooperId,omitempty"`
}

func (in CreateMaterialAssetInput) toEntity() *entities.MaterialAsset {
	condition := entities.MaterialCondition(in.Condition)
	if condition == "" {
		condition = entities.MaterialConditionGood
	}
	status := entities.MaterialAssetStatus(in.Status)
	if status == "" {
		status = entities.MaterialAssetStatusInService
	}

	return &entities.MaterialAsset{
		MaterialTypeID:    in.MaterialTypeID,
		UnitID:            in.UnitID,
		RoomID:            in.RoomID,
		SerialNumber:      in.SerialNumber,
		Condition:         condition,
		Status:            status,
		AssignedTrooperID: in.AssignedTrooperID,
	}
}

var updatableColumns = map[string]bool{
	"materialTypeId": true, "unitId": true, "roomId": true, "serialNumber": true,
	"condition": true, "status": true, "assignedTrooperId": true,
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
				return nil, fmt.Errorf("material_assets: condition must be a string")
			}
			if !entities.MaterialCondition(name).Valid() {
				return nil, fmt.Errorf("material_assets: invalid condition %q", name)
			}
		}

		if k == "status" {
			name, ok := v.(string)
			if !ok {
				return nil, fmt.Errorf("material_assets: status must be a string")
			}
			if !entities.MaterialAssetStatus(name).Valid() {
				return nil, fmt.Errorf("material_assets: invalid status %q", name)
			}
		}

		cols[k] = v
	}
	return cols, nil
}
