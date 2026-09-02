// Package materialstocks exposes bare CRUD endpoints over the
// material_stocks table. Same scope decisions as the students package.
package materialstocks

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/materialstocks"
)

var repo *materialstocks.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("materialstocks: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("materialstocks: run migrations: %w", err))
	}

	repo = materialstocks.NewRepository(conn)
}

type CreateMaterialStocksRequest struct {
	Data []CreateMaterialStockInput `json:"data"`
}

type MaterialStocksResponse struct {
	Data []*entities.MaterialStock `json:"data"`
}

//encore:api auth method=POST path=/material-stocks tag:audited
func CreateMaterialStocks(ctx context.Context, req *CreateMaterialStocksRequest) (*MaterialStocksResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one material stock"))
	}

	rows := make([]*entities.MaterialStock, len(req.Data))
	for i, in := range req.Data {
		if in.MaterialTypeID == 0 || in.UnitID == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("materialTypeId and unitId are required"))
		}
		if in.Condition != "" && !entities.MaterialCondition(in.Condition).Valid() {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid condition: %q", in.Condition))
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

	return &MaterialStocksResponse{Data: rows}, nil
}

type GetMaterialStocksRequest struct {
	Ids            []int64 `query:"ids"`
	UnitIds        []int64 `query:"unitIds"`
	RoomID         int64   `query:"roomId"`
	MaterialTypeID int64   `query:"materialTypeId"`
}

//encore:api auth method=GET path=/material-stocks
func GetMaterialStocks(ctx context.Context, req *GetMaterialStocksRequest) (*MaterialStocksResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, req.UnitIds, req.RoomID, req.MaterialTypeID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &MaterialStocksResponse{Data: rows}, nil
}

type GetMaterialStockResponse struct {
	Data *entities.MaterialStock `json:"data"`
}

//encore:api auth method=GET path=/material-stocks/:id
func GetMaterialStock(ctx context.Context, id int64) (*GetMaterialStockResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("material stock %d not found", id))
	}

	return &GetMaterialStockResponse{Data: row}, nil
}

type UpdateMaterialStockInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateMaterialStocksRequest struct {
	Data []UpdateMaterialStockInput `json:"data"`
}

//encore:api auth method=PATCH path=/material-stocks tag:audited
func UpdateMaterialStocks(ctx context.Context, req *UpdateMaterialStocksRequest) (*MaterialStocksResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.MaterialStock, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for material stock id %d: %v", u.ID, err))
		}

		cols, err := toUpdateParams(data)
		if err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("%v", err))
		}
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for material stock id %d", u.ID))
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

	return &MaterialStocksResponse{Data: rows}, nil
}

type DeleteMaterialStocksRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteMaterialStocksResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/material-stocks tag:audited
func DeleteMaterialStocks(ctx context.Context, req *DeleteMaterialStocksRequest) (*DeleteMaterialStocksResponse, error) {
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

	return &DeleteMaterialStocksResponse{Ids: req.Ids}, nil
}
