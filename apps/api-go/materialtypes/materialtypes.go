// Package materialtypes exposes bare CRUD endpoints over the
// material_types table. Same scope decisions as the students package.
package materialtypes

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/materialtypes"
)

var repo *materialtypes.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("materialtypes: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("materialtypes: run migrations: %w", err))
	}

	repo = materialtypes.NewRepository(conn)
}

type CreateMaterialTypesRequest struct {
	Data []CreateMaterialTypeInput `json:"data"`
}

type MaterialTypesResponse struct {
	Data []*entities.MaterialType `json:"data"`
}

//encore:api auth method=POST path=/material-types tag:audited
func CreateMaterialTypes(ctx context.Context, req *CreateMaterialTypesRequest) (*MaterialTypesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one material type"))
	}

	rows := make([]*entities.MaterialType, len(req.Data))
	for i, in := range req.Data {
		category := entities.MaterialCategory(in.Category)
		if !category.Valid() {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid category: %q", in.Category))
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

	return &MaterialTypesResponse{Data: rows}, nil
}

type GetMaterialTypesRequest struct {
	Ids      []int64 `query:"ids"`
	Category string  `query:"category"`
}

//encore:api auth method=GET path=/material-types
func GetMaterialTypes(ctx context.Context, req *GetMaterialTypesRequest) (*MaterialTypesResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, entities.MaterialCategory(req.Category))
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &MaterialTypesResponse{Data: rows}, nil
}

type GetMaterialTypeResponse struct {
	Data *entities.MaterialType `json:"data"`
}

//encore:api auth method=GET path=/material-types/:id
func GetMaterialType(ctx context.Context, id int64) (*GetMaterialTypeResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("material type %d not found", id))
	}

	return &GetMaterialTypeResponse{Data: row}, nil
}

type UpdateMaterialTypeInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateMaterialTypesRequest struct {
	Data []UpdateMaterialTypeInput `json:"data"`
}

//encore:api auth method=PATCH path=/material-types tag:audited
func UpdateMaterialTypes(ctx context.Context, req *UpdateMaterialTypesRequest) (*MaterialTypesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.MaterialType, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for material type id %d: %v", u.ID, err))
		}

		cols, err := toUpdateParams(data)
		if err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("%v", err))
		}
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for material type id %d", u.ID))
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

	return &MaterialTypesResponse{Data: rows}, nil
}

type DeleteMaterialTypesRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteMaterialTypesResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/material-types tag:audited
func DeleteMaterialTypes(ctx context.Context, req *DeleteMaterialTypesRequest) (*DeleteMaterialTypesResponse, error) {
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

	return &DeleteMaterialTypesResponse{Ids: req.Ids}, nil
}
