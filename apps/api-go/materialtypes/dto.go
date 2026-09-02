package materialtypes

import (
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type CreateMaterialTypeInput struct {
	Name          string  `json:"name"`
	Category      string  `json:"category"`
	UnitOfMeasure *string `json:"unitOfMeasure,omitempty"`
	IsSerialized  bool    `json:"isSerialized,omitempty"`
}

func (in CreateMaterialTypeInput) toEntity() *entities.MaterialType {
	return &entities.MaterialType{
		Name:          in.Name,
		Category:      entities.MaterialCategory(in.Category),
		UnitOfMeasure: in.UnitOfMeasure,
		IsSerialized:  in.IsSerialized,
	}
}

var updatableColumns = map[string]bool{
	"name": true, "category": true, "unitOfMeasure": true, "isSerialized": true,
}

func toUpdateParams(data map[string]any) (dbx.Params, error) {
	cols := dbx.Params{}
	for k, v := range data {
		if v == nil || !updatableColumns[k] {
			continue
		}

		if k == "category" {
			name, ok := v.(string)
			if !ok {
				return nil, fmt.Errorf("material_types: category must be a string")
			}
			if !entities.MaterialCategory(name).Valid() {
				return nil, fmt.Errorf("material_types: invalid category %q", name)
			}
		}

		cols[k] = v
	}
	return cols, nil
}
