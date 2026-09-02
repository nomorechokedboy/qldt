// Package users exposes bare CRUD endpoints over the users table.
// Role assignment lives in the userroles package; login/session handling
// stays in apps/api for now (its argon2 hashes use a secret pepper Go's
// standard library doesn't support — see internal/entities/user.go).
package users

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/users"
)

var repo *users.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("users: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("users: run migrations: %w", err))
	}

	repo = users.NewRepository(conn)
}

type CreateUsersRequest struct {
	Data []CreateUserInput `json:"data"`
}

type UsersResponse struct {
	Data []*entities.User `json:"data"`
}

//encore:api auth method=POST path=/users tag:audited
func CreateUsers(ctx context.Context, req *CreateUsersRequest) (*UsersResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one user"))
	}

	rows := make([]*entities.User, len(req.Data))
	for i, in := range req.Data {
		if in.Username == "" || in.Password == "" {
			return nil, apperr.Wrap(apperr.InvalidArgument("username and password are required"))
		}
		row, err := in.toEntity()
		if err != nil {
			return nil, apperr.Wrap(err)
		}
		rows[i] = row
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &UsersResponse{Data: rows}, nil
}

type GetUsersRequest struct {
	Ids []int64 `query:"ids"`
}

//encore:api auth method=GET path=/users
func GetUsers(ctx context.Context, req *GetUsersRequest) (*UsersResponse, error) {
	rows, err := repo.Find(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &UsersResponse{Data: rows}, nil
}

type GetUserResponse struct {
	Data *entities.User `json:"data"`
}

//encore:api auth method=GET path=/users/:id
func GetUser(ctx context.Context, id int64) (*GetUserResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("user %d not found", id))
	}

	return &GetUserResponse{Data: row}, nil
}

type UpdateUserInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateUsersRequest struct {
	Data []UpdateUserInput `json:"data"`
}

//encore:api auth method=PATCH path=/users tag:audited
func UpdateUsers(ctx context.Context, req *UpdateUsersRequest) (*UsersResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.User, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for user id %d: %v", u.ID, err))
		}

		cols, err := toUpdateParams(data)
		if err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("%v", err))
		}
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for user id %d", u.ID))
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

	return &UsersResponse{Data: rows}, nil
}

type DeleteUsersRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteUsersResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/users tag:audited
func DeleteUsers(ctx context.Context, req *DeleteUsersRequest) (*DeleteUsersResponse, error) {
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

	return &DeleteUsersResponse{Ids: req.Ids}, nil
}
