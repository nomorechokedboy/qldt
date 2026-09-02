package units

import (
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

// CreateUnitInput mirrors apps/api's units/controller.ts unit creation body.
type CreateUnitInput struct {
	Alias                      string `json:"alias"`
	Name                       string `json:"name"`
	Level                      string `json:"level"`
	ParentID                   *int64 `json:"parentId,omitempty"`
	CommanderID                *int64 `json:"commanderId,omitempty"`
	DeputyCommanderID          *int64 `json:"deputyCommanderId,omitempty"`
	PoliticalCommanderID       *int64 `json:"politicalCommanderId,omitempty"`
	DeputyPoliticalCommanderID *int64 `json:"deputyPoliticalCommanderId,omitempty"`
}

func (in CreateUnitInput) toEntity() *entities.Unit {
	return &entities.Unit{
		Alias:                      in.Alias,
		Name:                       in.Name,
		Level:                      entities.UnitLevel(in.Level),
		ParentID:                   in.ParentID,
		CommanderID:                in.CommanderID,
		DeputyCommanderID:          in.DeputyCommanderID,
		PoliticalCommanderID:       in.PoliticalCommanderID,
		DeputyPoliticalCommanderID: in.DeputyPoliticalCommanderID,
	}
}

// updatableColumns is every units column an UpdateUnits caller is allowed
// to touch (everything except pk/createdAt/updatedAt).
var updatableColumns = map[string]bool{
	"alias": true, "name": true, "level": true, "parentId": true,
	"commanderId": true, "deputyCommanderId": true,
	"politicalCommanderId": true, "deputyPoliticalCommanderId": true,
}

// toUpdateParams keeps only the recognized, non-nil columns from a partial
// update payload, converting `level` from its name to the stable integer
// code the DB stores.
func toUpdateParams(data map[string]any) (dbx.Params, error) {
	cols := dbx.Params{}
	for k, v := range data {
		if v == nil || !updatableColumns[k] {
			continue
		}

		if k == "level" {
			name, ok := v.(string)
			if !ok {
				return nil, fmt.Errorf("units: level must be a string")
			}
			level := entities.UnitLevel(name)
			if !level.Valid() {
				return nil, fmt.Errorf("units: invalid level %q", name)
			}
			value, err := level.Value()
			if err != nil {
				return nil, err
			}
			cols[k] = value
			continue
		}

		cols[k] = v
	}
	return cols, nil
}
