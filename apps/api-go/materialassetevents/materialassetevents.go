// Package materialassetevents exposes create/read endpoints over the
// material_asset_events table. No update/delete — apps/api/schema/
// material-asset-events.ts exposes no update/delete type, treating it as an
// append-only audit trail.
package materialassetevents

import (
	"context"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/materialassetevents"
)

var repo *materialassetevents.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("materialassetevents: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("materialassetevents: run migrations: %w", err))
	}

	repo = materialassetevents.NewRepository(conn)
}

type CreateMaterialAssetEventsRequest struct {
	Data []CreateMaterialAssetEventInput `json:"data"`
}

type MaterialAssetEventsResponse struct {
	Data []*entities.MaterialAssetEvent `json:"data"`
}

//encore:api auth method=POST path=/material-asset-events
func CreateMaterialAssetEvents(ctx context.Context, req *CreateMaterialAssetEventsRequest) (*MaterialAssetEventsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one event"))
	}

	rows := make([]*entities.MaterialAssetEvent, len(req.Data))
	for i, in := range req.Data {
		if in.AssetID == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("assetId is required"))
		}
		if !entities.MaterialAssetEventType(in.EventType).Valid() {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid eventType: %q", in.EventType))
		}
		rows[i] = in.toEntity()
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	return &MaterialAssetEventsResponse{Data: rows}, nil
}

type GetMaterialAssetEventsRequest struct {
	Ids     []int64 `query:"ids"`
	AssetID int64   `query:"assetId"`
}

//encore:api auth method=GET path=/material-asset-events
func GetMaterialAssetEvents(ctx context.Context, req *GetMaterialAssetEventsRequest) (*MaterialAssetEventsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, req.AssetID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &MaterialAssetEventsResponse{Data: rows}, nil
}

type GetMaterialAssetEventResponse struct {
	Data *entities.MaterialAssetEvent `json:"data"`
}

//encore:api auth method=GET path=/material-asset-events/:id
func GetMaterialAssetEvent(ctx context.Context, id int64) (*GetMaterialAssetEventResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("material asset event %d not found", id))
	}

	return &GetMaterialAssetEventResponse{Data: row}, nil
}
