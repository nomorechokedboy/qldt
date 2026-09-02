// Package actions exposes bare CRUD endpoints over the actions table (the
// RBAC "what can be done" lookup table — e.g. "create", "read"). Same scope
// decisions as the students package.
package actions

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/actions"
	"encore.app/internal/apperr"
	"encore.app/internal/db"
	"encore.app/internal/entities"
)

var repo *actions.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("actions: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("actions: run migrations: %w", err))
	}

	repo = actions.NewRepository(conn)
}

type CreateActionsRequest struct {
	Data []CreateActionInput `json:"data"`
}

type ActionsResponse struct {
	Data []*entities.Action `json:"data"`
}

//encore:api auth method=POST path=/actions
func CreateActions(ctx context.Context, req *CreateActionsRequest) (*ActionsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one action"))
	}

	rows := make([]*entities.Action, len(req.Data))
	for i, in := range req.Data {
		rows[i] = in.toEntity()
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	return &ActionsResponse{Data: rows}, nil
}

type GetActionsRequest struct {
	Ids []int64 `query:"ids"`
}

//encore:api auth method=GET path=/actions
func GetActions(ctx context.Context, req *GetActionsRequest) (*ActionsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &ActionsResponse{Data: rows}, nil
}

type GetActionResponse struct {
	Data *entities.Action `json:"data"`
}

//encore:api auth method=GET path=/actions/:id
func GetAction(ctx context.Context, id int64) (*GetActionResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("action %d not found", id))
	}

	return &GetActionResponse{Data: row}, nil
}

type UpdateActionInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateActionsRequest struct {
	Data []UpdateActionInput `json:"data"`
}

//encore:api auth method=PATCH path=/actions
func UpdateActions(ctx context.Context, req *UpdateActionsRequest) (*ActionsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Action, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for action id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for action id %d", u.ID))
		}

		row, err := repo.Update(ctx, u.ID, cols)
		if err != nil {
			return nil, apperr.Wrap(err)
		}
		rows[i] = row
	}

	return &ActionsResponse{Data: rows}, nil
}

type DeleteActionsRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteActionsResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/actions
func DeleteActions(ctx context.Context, req *DeleteActionsRequest) (*DeleteActionsResponse, error) {
	if len(req.Ids) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("ids must contain at least one id"))
	}

	if _, err := repo.Delete(ctx, req.Ids); err != nil {
		return nil, apperr.Wrap(err)
	}

	return &DeleteActionsResponse{Ids: req.Ids}, nil
}
