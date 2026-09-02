// Package rolepermissions exposes assign/list/remove endpoints over the
// role_permissions join table (composite PK, no own id — see
// internal/rolepermissions for why this isn't generic id-keyed CRUD).
package rolepermissions

import (
	"context"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/rolepermissions"
)

var repo *rolepermissions.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("rolepermissions: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("rolepermissions: run migrations: %w", err))
	}

	repo = rolepermissions.NewRepository(conn)
}

type AssignRolePermissionsRequest struct {
	PermissionIds []int64 `json:"permissionIds"`
}

type RolePermissionsResponse struct {
	Data []*entities.RolePermission `json:"data"`
}

//encore:api auth method=POST path=/roles/:roleId/permissions tag:audited
func AssignRolePermissions(ctx context.Context, roleId int64, req *AssignRolePermissionsRequest) (*RolePermissionsResponse, error) {
	if len(req.PermissionIds) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("permissionIds must contain at least one id"))
	}

	if err := repo.Assign(ctx, roleId, req.PermissionIds); err != nil {
		return nil, apperr.Wrap(err)
	}

	rows, err := repo.ListByRole(ctx, roleId)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := []any{roleId}
	for _, id := range req.PermissionIds {
		ids = append(ids, id)
	}
	auditctx.SetContext(ctx, ids, nil, nil)

	return &RolePermissionsResponse{Data: rows}, nil
}

//encore:api auth method=GET path=/roles/:roleId/permissions
func GetRolePermissions(ctx context.Context, roleId int64) (*RolePermissionsResponse, error) {
	rows, err := repo.ListByRole(ctx, roleId)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &RolePermissionsResponse{Data: rows}, nil
}

type RemoveRolePermissionsRequest struct {
	PermissionIds []int64 `query:"permissionIds"`
}

type RemoveRolePermissionsResponse struct {
	PermissionIds []int64 `json:"permissionIds"`
}

//encore:api auth method=DELETE path=/roles/:roleId/permissions tag:audited
func RemoveRolePermissions(ctx context.Context, roleId int64, req *RemoveRolePermissionsRequest) (*RemoveRolePermissionsResponse, error) {
	if len(req.PermissionIds) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("permissionIds must contain at least one id"))
	}

	if err := repo.Remove(ctx, roleId, req.PermissionIds); err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := []any{roleId}
	for _, id := range req.PermissionIds {
		ids = append(ids, id)
	}
	auditctx.SetContext(ctx, ids, nil, nil)

	return &RemoveRolePermissionsResponse{PermissionIds: req.PermissionIds}, nil
}
