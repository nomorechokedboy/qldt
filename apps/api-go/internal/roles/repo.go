// Package roles is the persistence layer for the roles table. Bare CRUD
// only, same scope decision as internal/students.
package roles

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

func (r *Repository) Create(ctx context.Context, rows []*entities.Role) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("roles: insert: %w", err)
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

	byID := make(map[int64]*entities.Role, len(found))
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

func (r *Repository) Find(ctx context.Context, ids []int64) ([]*entities.Role, error) {
	q := r.db.WithContext(ctx).Select("*").From("roles").OrderBy("id")
	if len(ids) > 0 {
		q = q.Where(dbx.In("id", toInterfaceSlice(ids)...))
	}

	var rows []*entities.Role
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("roles: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.Role, error) {
	var row entities.Role
	err := r.db.WithContext(ctx).
		Select("*").
		From("roles").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("roles: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.Role, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("roles: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("roles", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("roles: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.Role, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("roles: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("roles", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("roles: delete: %w", err)
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
