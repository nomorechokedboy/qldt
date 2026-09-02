// Package buildings exposes bare CRUD endpoints over the buildings table.
// Same scope decisions as the students package.
package buildings

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/buildings"
	"encore.app/internal/db"
	"encore.app/internal/entities"
)

var repo *buildings.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("buildings: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("buildings: run migrations: %w", err))
	}

	repo = buildings.NewRepository(conn)
}

type CreateBuildingsRequest struct {
	Data []CreateBuildingInput `json:"data"`
}

type BuildingsResponse struct {
	Data []*entities.Building `json:"data"`
}

//encore:api auth method=POST path=/buildings tag:audited
func CreateBuildings(ctx context.Context, req *CreateBuildingsRequest) (*BuildingsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one building"))
	}

	rows := make([]*entities.Building, len(req.Data))
	for i, in := range req.Data {
		if in.UnitID == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("unitId is required"))
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

	return &BuildingsResponse{Data: rows}, nil
}

type GetBuildingsRequest struct {
	Ids     []int64 `query:"ids"`
	UnitIds []int64 `query:"unitIds"`
}

//encore:api auth method=GET path=/buildings
func GetBuildings(ctx context.Context, req *GetBuildingsRequest) (*BuildingsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, req.UnitIds)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &BuildingsResponse{Data: rows}, nil
}

type GetBuildingResponse struct {
	Data *entities.Building `json:"data"`
}

//encore:api auth method=GET path=/buildings/:id
func GetBuilding(ctx context.Context, id int64) (*GetBuildingResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("building %d not found", id))
	}

	return &GetBuildingResponse{Data: row}, nil
}

type UpdateBuildingInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateBuildingsRequest struct {
	Data []UpdateBuildingInput `json:"data"`
}

//encore:api auth method=PATCH path=/buildings tag:audited
func UpdateBuildings(ctx context.Context, req *UpdateBuildingsRequest) (*BuildingsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Building, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for building id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for building id %d", u.ID))
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

	return &BuildingsResponse{Data: rows}, nil
}

type DeleteBuildingsRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteBuildingsResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/buildings tag:audited
func DeleteBuildings(ctx context.Context, req *DeleteBuildingsRequest) (*DeleteBuildingsResponse, error) {
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

	return &DeleteBuildingsResponse{Ids: req.Ids}, nil
}
