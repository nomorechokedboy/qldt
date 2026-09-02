package roles

import (
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateRoleInput struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

func (in CreateRoleInput) toEntity() *entities.Role {
	return &entities.Role{
		Name:        in.Name,
		Description: in.Description,
	}
}

var updatableColumns = map[string]bool{
	"name": true, "description": true,
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
