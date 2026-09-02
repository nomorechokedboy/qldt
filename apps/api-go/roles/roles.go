// Package roles exposes bare CRUD endpoints over the roles table. Role<->
// permission assignment lives in the rolepermissions package, not here. Same
// scope decisions as the students package.
package roles

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/roles"
)

var repo *roles.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("roles: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("roles: run migrations: %w", err))
	}

	repo = roles.NewRepository(conn)
}

type CreateRolesRequest struct {
	Data []CreateRoleInput `json:"data"`
}

type RolesResponse struct {
	Data []*entities.Role `json:"data"`
}

//encore:api auth method=POST path=/roles tag:audited
func CreateRoles(ctx context.Context, req *CreateRolesRequest) (*RolesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one role"))
	}

	rows := make([]*entities.Role, len(req.Data))
	for i, in := range req.Data {
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

	return &RolesResponse{Data: rows}, nil
}

type GetRolesRequest struct {
	Ids []int64 `query:"ids"`
}

//encore:api auth method=GET path=/roles
func GetRoles(ctx context.Context, req *GetRolesRequest) (*RolesResponse, error) {
	rows, err := repo.Find(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &RolesResponse{Data: rows}, nil
}

type GetRoleResponse struct {
	Data *entities.Role `json:"data"`
}

//encore:api auth method=GET path=/roles/:id
func GetRole(ctx context.Context, id int64) (*GetRoleResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("role %d not found", id))
	}

	return &GetRoleResponse{Data: row}, nil
}

type UpdateRoleInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateRolesRequest struct {
	Data []UpdateRoleInput `json:"data"`
}

//encore:api auth method=PATCH path=/roles tag:audited
func UpdateRoles(ctx context.Context, req *UpdateRolesRequest) (*RolesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Role, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for role id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for role id %d", u.ID))
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

	return &RolesResponse{Data: rows}, nil
}

type DeleteRolesRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteRolesResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/roles tag:audited
func DeleteRoles(ctx context.Context, req *DeleteRolesRequest) (*DeleteRolesResponse, error) {
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

	return &DeleteRolesResponse{Ids: req.Ids}, nil
}
