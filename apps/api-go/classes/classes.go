// Package classes exposes bare CRUD endpoints over the classes table. Same
// scope decisions as the students package — see apps/api-go/README.md.
package classes

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/classes"
	"encore.app/internal/db"
	"encore.app/internal/entities"
)

var repo *classes.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("classes: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("classes: run migrations: %w", err))
	}

	repo = classes.NewRepository(conn)
}

type CreateClassesRequest struct {
	Data []CreateClassInput `json:"data"`
}

type ClassesResponse struct {
	Data []*entities.Class `json:"data"`
}

// CreateClasses inserts one or more classes.
//
//encore:api auth method=POST path=/classes tag:audited
func CreateClasses(ctx context.Context, req *CreateClassesRequest) (*ClassesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one class"))
	}

	rows := make([]*entities.Class, len(req.Data))
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

	return &ClassesResponse{Data: rows}, nil
}

type GetClassesRequest struct {
	Ids     []int64 `query:"ids"`
	UnitIds []int64 `query:"unitIds"`
}

// GetClasses lists classes, optionally filtered by id and/or unitId.
//
//encore:api auth method=GET path=/classes
func GetClasses(ctx context.Context, req *GetClassesRequest) (*ClassesResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, req.UnitIds)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &ClassesResponse{Data: rows}, nil
}

type GetClassResponse struct {
	Data *entities.Class `json:"data"`
}

// GetClass returns a single class by id.
//
//encore:api auth method=GET path=/classes/:id
func GetClass(ctx context.Context, id int64) (*GetClassResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("class %d not found", id))
	}

	return &GetClassResponse{Data: row}, nil
}

type UpdateClassInput struct {
	ID int64 `json:"id"`
	// Data is a JSON object with any subset of the classes columns; kept as
	// raw JSON (rather than map[string]any) because Encore's API schema
	// doesn't support interface-typed fields.
	Data json.RawMessage `json:"data"`
}

type UpdateClassesRequest struct {
	Data []UpdateClassInput `json:"data"`
}

// UpdateClasses applies a partial update to one or more classes.
//
//encore:api auth method=PATCH path=/classes tag:audited
func UpdateClasses(ctx context.Context, req *UpdateClassesRequest) (*ClassesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Class, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for class id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for class id %d", u.ID))
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

	return &ClassesResponse{Data: rows}, nil
}

type DeleteClassesRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteClassesResponse struct {
	Ids []int64 `json:"ids"`
}

// DeleteClasses removes one or more classes by id.
//
//encore:api auth method=DELETE path=/classes tag:audited
func DeleteClasses(ctx context.Context, req *DeleteClassesRequest) (*DeleteClassesResponse, error) {
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

	return &DeleteClassesResponse{Ids: req.Ids}, nil
}
