// Package permissions exposes bare CRUD endpoints over the permissions
// table (resource+action pairs, e.g. "classes:create"). Same scope
// decisions as the students package.
package permissions

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/permissions"
)

var repo *permissions.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("permissions: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("permissions: run migrations: %w", err))
	}

	repo = permissions.NewRepository(conn)
}

type CreatePermissionsRequest struct {
	Data []CreatePermissionInput `json:"data"`
}

type PermissionsResponse struct {
	Data []*entities.Permission `json:"data"`
}

//encore:api auth method=POST path=/permissions tag:audited
func CreatePermissions(ctx context.Context, req *CreatePermissionsRequest) (*PermissionsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one permission"))
	}

	rows := make([]*entities.Permission, len(req.Data))
	for i, in := range req.Data {
		if in.ResourceID == 0 || in.ActionID == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("resourceId and actionId are required"))
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

	return &PermissionsResponse{Data: rows}, nil
}

type GetPermissionsRequest struct {
	Ids        []int64 `query:"ids"`
	ResourceID int64   `query:"resourceId"`
	ActionID   int64   `query:"actionId"`
}

//encore:api auth method=GET path=/permissions
func GetPermissions(ctx context.Context, req *GetPermissionsRequest) (*PermissionsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, req.ResourceID, req.ActionID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &PermissionsResponse{Data: rows}, nil
}

type GetPermissionResponse struct {
	Data *entities.Permission `json:"data"`
}

//encore:api auth method=GET path=/permissions/:id
func GetPermission(ctx context.Context, id int64) (*GetPermissionResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("permission %d not found", id))
	}

	return &GetPermissionResponse{Data: row}, nil
}

type UpdatePermissionInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdatePermissionsRequest struct {
	Data []UpdatePermissionInput `json:"data"`
}

//encore:api auth method=PATCH path=/permissions tag:audited
func UpdatePermissions(ctx context.Context, req *UpdatePermissionsRequest) (*PermissionsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Permission, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for permission id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for permission id %d", u.ID))
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

	return &PermissionsResponse{Data: rows}, nil
}

type DeletePermissionsRequest struct {
	Ids []int64 `query:"ids"`
}

type DeletePermissionsResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/permissions tag:audited
func DeletePermissions(ctx context.Context, req *DeletePermissionsRequest) (*DeletePermissionsResponse, error) {
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

	return &DeletePermissionsResponse{Ids: req.Ids}, nil
}
