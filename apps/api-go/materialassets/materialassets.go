// Package materialassets exposes bare CRUD endpoints over the
// material_assets table. Same scope decisions as the students package.
package materialassets

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/materialassets"
)

var repo *materialassets.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("materialassets: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("materialassets: run migrations: %w", err))
	}

	repo = materialassets.NewRepository(conn)
}

type CreateMaterialAssetsRequest struct {
	Data []CreateMaterialAssetInput `json:"data"`
}

type MaterialAssetsResponse struct {
	Data []*entities.MaterialAsset `json:"data"`
}

//encore:api auth method=POST path=/material-assets tag:audited
func CreateMaterialAssets(ctx context.Context, req *CreateMaterialAssetsRequest) (*MaterialAssetsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one material asset"))
	}

	rows := make([]*entities.MaterialAsset, len(req.Data))
	for i, in := range req.Data {
		if in.MaterialTypeID == 0 || in.UnitID == 0 || in.SerialNumber == "" {
			return nil, apperr.Wrap(apperr.InvalidArgument("materialTypeId, unitId, and serialNumber are required"))
		}
		if in.Condition != "" && !entities.MaterialCondition(in.Condition).Valid() {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid condition: %q", in.Condition))
		}
		if in.Status != "" && !entities.MaterialAssetStatus(in.Status).Valid() {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid status: %q", in.Status))
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

	return &MaterialAssetsResponse{Data: rows}, nil
}

type GetMaterialAssetsRequest struct {
	Ids               []int64 `query:"ids"`
	UnitIds           []int64 `query:"unitIds"`
	RoomID            int64   `query:"roomId"`
	MaterialTypeID    int64   `query:"materialTypeId"`
	Status            string  `query:"status"`
	AssignedTrooperID int64   `query:"assignedTrooperId"`
}

//encore:api auth method=GET path=/material-assets
func GetMaterialAssets(ctx context.Context, req *GetMaterialAssetsRequest) (*MaterialAssetsResponse, error) {
	rows, err := repo.Find(ctx, materialassets.Filter{
		Ids:               req.Ids,
		UnitIds:           req.UnitIds,
		RoomID:            req.RoomID,
		MaterialTypeID:    req.MaterialTypeID,
		Status:            entities.MaterialAssetStatus(req.Status),
		AssignedTrooperID: req.AssignedTrooperID,
	})
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &MaterialAssetsResponse{Data: rows}, nil
}

type GetMaterialAssetResponse struct {
	Data *entities.MaterialAsset `json:"data"`
}

//encore:api auth method=GET path=/material-assets/:id
func GetMaterialAsset(ctx context.Context, id int64) (*GetMaterialAssetResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("material asset %d not found", id))
	}

	return &GetMaterialAssetResponse{Data: row}, nil
}

type UpdateMaterialAssetInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateMaterialAssetsRequest struct {
	Data []UpdateMaterialAssetInput `json:"data"`
}

//encore:api auth method=PATCH path=/material-assets tag:audited
func UpdateMaterialAssets(ctx context.Context, req *UpdateMaterialAssetsRequest) (*MaterialAssetsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.MaterialAsset, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for material asset id %d: %v", u.ID, err))
		}

		cols, err := toUpdateParams(data)
		if err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("%v", err))
		}
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for material asset id %d", u.ID))
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

	return &MaterialAssetsResponse{Data: rows}, nil
}

type DeleteMaterialAssetsRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteMaterialAssetsResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/material-assets tag:audited
func DeleteMaterialAssets(ctx context.Context, req *DeleteMaterialAssetsRequest) (*DeleteMaterialAssetsResponse, error) {
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

	return &DeleteMaterialAssetsResponse{Ids: req.Ids}, nil
}
