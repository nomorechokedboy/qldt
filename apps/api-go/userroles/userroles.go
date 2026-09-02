// Package userroles exposes assign/list/remove endpoints over the
// user_roles join table (composite PK, no own id — see internal/userroles
// for why this isn't generic id-keyed CRUD).
package userroles

import (
	"context"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/userroles"
)

var repo *userroles.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("userroles: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("userroles: run migrations: %w", err))
	}

	repo = userroles.NewRepository(conn)
}

type AssignUserRolesRequest struct {
	RoleIds []int64 `json:"roleIds"`
}

type UserRolesResponse struct {
	Data []*entities.UserRole `json:"data"`
}

//encore:api auth method=POST path=/users/:userId/roles tag:audited
func AssignUserRoles(ctx context.Context, userId int64, req *AssignUserRolesRequest) (*UserRolesResponse, error) {
	if len(req.RoleIds) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("roleIds must contain at least one id"))
	}

	if err := repo.Assign(ctx, userId, req.RoleIds); err != nil {
		return nil, apperr.Wrap(err)
	}

	rows, err := repo.ListByUser(ctx, userId)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := []any{userId}
	for _, id := range req.RoleIds {
		ids = append(ids, id)
	}
	auditctx.SetContext(ctx, ids, nil, nil)

	return &UserRolesResponse{Data: rows}, nil
}

//encore:api auth method=GET path=/users/:userId/roles
func GetUserRoles(ctx context.Context, userId int64) (*UserRolesResponse, error) {
	rows, err := repo.ListByUser(ctx, userId)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &UserRolesResponse{Data: rows}, nil
}

type RemoveUserRolesRequest struct {
	RoleIds []int64 `query:"roleIds"`
}

type RemoveUserRolesResponse struct {
	RoleIds []int64 `json:"roleIds"`
}

//encore:api auth method=DELETE path=/users/:userId/roles tag:audited
func RemoveUserRoles(ctx context.Context, userId int64, req *RemoveUserRolesRequest) (*RemoveUserRolesResponse, error) {
	if len(req.RoleIds) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("roleIds must contain at least one id"))
	}

	if err := repo.Remove(ctx, userId, req.RoleIds); err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := []any{userId}
	for _, id := range req.RoleIds {
		ids = append(ids, id)
	}
	auditctx.SetContext(ctx, ids, nil, nil)

	return &RemoveUserRolesResponse{RoleIds: req.RoleIds}, nil
}
