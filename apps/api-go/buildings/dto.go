package buildings

import (
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateBuildingInput struct {
	UnitID      int64   `json:"unitId"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

func (in CreateBuildingInput) toEntity() *entities.Building {
	return &entities.Building{
		UnitID:      in.UnitID,
		Name:        in.Name,
		Description: in.Description,
	}
}

var updatableColumns = map[string]bool{
	"unitId": true, "name": true, "description": true,
}

func toUpdateParams(data map[string]any) dbx.Params {
	cols := dbx.Params{}
	for k, v := range data {
		if v == nil || !updatableColumns[k] {
			continue
		}
		cols[k] = v
	}
	return cols
}
