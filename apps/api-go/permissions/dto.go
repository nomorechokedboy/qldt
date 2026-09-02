package permissions

import (
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreatePermissionInput struct {
	Name        string  `json:"name"`
	DisplayName string  `json:"displayName"`
	Description *string `json:"description,omitempty"`
	ResourceID  int64   `json:"resourceId"`
	ActionID    int64   `json:"actionId"`
}

func (in CreatePermissionInput) toEntity() *entities.Permission {
	return &entities.Permission{
		Name:        in.Name,
		DisplayName: in.DisplayName,
		Description: in.Description,
		ResourceID:  in.ResourceID,
		ActionID:    in.ActionID,
	}
}

var updatableColumns = map[string]bool{
	"name": true, "display_name": true, "description": true,
	"resource_id": true, "action_id": true,
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
