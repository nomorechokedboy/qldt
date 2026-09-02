// Package units exposes bare CRUD endpoints over the units table. Same
// scope decisions as the students package — see apps/api-go/README.md.
package units

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/units"
)

var repo *units.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("units: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("units: run migrations: %w", err))
	}

	repo = units.NewRepository(conn)
}

type CreateUnitsRequest struct {
	Data []CreateUnitInput `json:"data"`
}

type UnitsResponse struct {
	Data []*entities.Unit `json:"data"`
}

// CreateUnits inserts one or more units.
//
//encore:api auth method=POST path=/units tag:audited
func CreateUnits(ctx context.Context, req *CreateUnitsRequest) (*UnitsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one unit"))
	}

	rows := make([]*entities.Unit, len(req.Data))
	for i, in := range req.Data {
		level := entities.UnitLevel(in.Level)
		if !level.Valid() {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid unit level: %q", in.Level))
		}
		rows[i] = in.toEntity()
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &UnitsResponse{Data: rows}, nil
}

type GetUnitsRequest struct {
	Ids   []int64 `query:"ids"`
	Level string  `query:"level"`
}

// GetUnits lists units, optionally filtered by id and/or level.
//
//encore:api auth method=GET path=/units
func GetUnits(ctx context.Context, req *GetUnitsRequest) (*UnitsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, entities.UnitLevel(req.Level))
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &UnitsResponse{Data: rows}, nil
}

type GetUnitResponse struct {
	Data *entities.Unit `json:"data"`
}

// GetUnit returns a single unit by id.
//
//encore:api auth method=GET path=/units/:id
func GetUnit(ctx context.Context, id int64) (*GetUnitResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("unit %d not found", id))
	}

	return &GetUnitResponse{Data: row}, nil
}

type UpdateUnitInput struct {
	ID int64 `json:"id"`
	// Data is a JSON object with any subset of the units columns; kept as
	// raw JSON (rather than map[string]any) because Encore's API schema
	// doesn't support interface-typed fields.
	Data json.RawMessage `json:"data"`
}

type UpdateUnitsRequest struct {
	Data []UpdateUnitInput `json:"data"`
}

// UpdateUnits applies a partial update to one or more units.
//
//encore:api auth method=PATCH path=/units tag:audited
func UpdateUnits(ctx context.Context, req *UpdateUnitsRequest) (*UnitsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Unit, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for unit id %d: %v", u.ID, err))
		}

		cols, err := toUpdateParams(data)
		if err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("%v", err))
		}
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for unit id %d", u.ID))
		}

		row, err := repo.Update(ctx, u.ID, cols)
		if err != nil {
			return nil, apperr.Wrap(err)
		}
		rows[i] = row
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &UnitsResponse{Data: rows}, nil
}

type DeleteUnitsRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteUnitsResponse struct {
	Ids []int64 `json:"ids"`
}

// DeleteUnits removes one or more units by id.
//
//encore:api auth method=DELETE path=/units tag:audited
func DeleteUnits(ctx context.Context, req *DeleteUnitsRequest) (*DeleteUnitsResponse, error) {
	if len(req.Ids) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("ids must contain at least one id"))
	}

	deleted, err := repo.Delete(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(req.Ids))
	for i, id := range req.Ids {
		ids[i] = id
	}
	auditctx.SetContext(ctx, ids, deleted, nil)

	return &DeleteUnitsResponse{Ids: req.Ids}, nil
}
