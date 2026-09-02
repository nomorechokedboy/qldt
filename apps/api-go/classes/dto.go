package classes

import (
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

// CreateClassInput mirrors apps/api's classes/controller.ts ClassParam.
type CreateClassInput struct {
	Name        string  `json:"name"`
	Description string  `json:"description,omitempty"`
	GraduatedAt *string `json:"graduatedAt,omitempty"`
	UnitID      int64   `json:"unitId"`
}

func (in CreateClassInput) toEntity() *entities.Class {
	status := entities.ClassStatusOngoing

	return &entities.Class{
		Name:        in.Name,
		Description: in.Description,
		GraduatedAt: in.GraduatedAt,
		Status:      status,
		UnitID:      in.UnitID,
	}
}

// updatableColumns is every classes column an UpdateClasses caller is
// allowed to touch (everything except pk/createdAt/updatedAt).
var updatableColumns = map[string]bool{
	"name": true, "description": true, "unitId": true, "graduatedAt": true,
	"status": true,
}

// toUpdateParams keeps only the recognized, non-nil columns from a partial
// update payload.
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
