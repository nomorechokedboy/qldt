package resources

import (
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateResourceInput struct {
	Name        string  `json:"name"`
	DisplayName string  `json:"displayName"`
	Description *string `json:"description,omitempty"`
}

func (in CreateResourceInput) toEntity() *entities.Resource {
	return &entities.Resource{
		Name:        in.Name,
		DisplayName: in.DisplayName,
		Description: in.Description,
	}
}

var updatableColumns = map[string]bool{
	"name": true, "display_name": true, "description": true,
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
