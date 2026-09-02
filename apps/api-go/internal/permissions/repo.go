// Package permissions is the persistence layer for the permissions table.
// Bare CRUD only, same scope decision as internal/students.
package permissions

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

func (r *Repository) Create(ctx context.Context, rows []*entities.Permission) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("permissions: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, ids, 0, 0)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.Permission, len(found))
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

// Find returns permissions matching ids, resourceID, and/or actionID (0
// meaning "no filter" for the latter two).
func (r *Repository) Find(ctx context.Context, ids []int64, resourceID, actionID int64) ([]*entities.Permission, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if resourceID != 0 {
		conds = append(conds, dbx.HashExp{"resource_id": resourceID})
	}
	if actionID != 0 {
		conds = append(conds, dbx.HashExp{"action_id": actionID})
	}

	q := r.db.WithContext(ctx).Select("*").From("permissions").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.Permission
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("permissions: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.Permission, error) {
	var row entities.Permission
	err := r.db.WithContext(ctx).
		Select("*").
		From("permissions").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("permissions: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.Permission, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("permissions: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("permissions", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("permissions: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.Permission, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("permissions: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids, 0, 0)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("permissions", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("permissions: delete: %w", err)
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
