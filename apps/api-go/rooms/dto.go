package rooms

import (
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateRoomInput struct {
	UnitID      int64   `json:"unitId"`
	BuildingID  *int64  `json:"buildingId,omitempty"`
	Name        string  `json:"name"`
	Type        *string `json:"type,omitempty"`
	Description *string `json:"description,omitempty"`
}

func (in CreateRoomInput) toEntity() *entities.Room {
	return &entities.Room{
		UnitID:      in.UnitID,
		BuildingID:  in.BuildingID,
		Name:        in.Name,
		Type:        in.Type,
		Description: in.Description,
	}
}

var updatableColumns = map[string]bool{
	"unitId": true, "buildingId": true, "name": true, "type": true, "description": true,
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
