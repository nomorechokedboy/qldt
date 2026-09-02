// Package users is the persistence layer for the users table. Bare CRUD
// only — no role assignment (see internal/userroles), no login/session
// handling (that stays in apps/api for now, see README.md).
package users

import (
	"context"
	"fmt"

	"encore.app/internal/apperr"
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type Repository struct {
	db *dbx.DB
}

func NewRepository(db *dbx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, rows []*entities.User) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("users: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, ids)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.User, len(found))
	for _, row := range found {
		byID[row.ID] = row
	}
	for i, row := range rows {
		if fresh, ok := byID[row.ID]; ok {
			*rows[i] = *fresh
		}
	}

	return nil
}

func (r *Repository) Find(ctx context.Context, ids []int64) ([]*entities.User, error) {
	q := r.db.WithContext(ctx).Select("*").From("users").OrderBy("id")
	if len(ids) > 0 {
		q = q.Where(dbx.In("id", toInterfaceSlice(ids)...))
	}

	var rows []*entities.User
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("users: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.User, error) {
	var row entities.User
	err := r.db.WithContext(ctx).
		Select("*").
		From("users").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("users: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.User, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("users: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("users", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("users: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.User, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("users: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("users", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("users: delete: %w", err)
	}

	return deleted, nil
}

func toInterfaceSlice[T any](in []T) []interface{} {
	out := make([]interface{}, len(in))
	for i, v := range in {
		out[i] = v
	}
	return out
}
