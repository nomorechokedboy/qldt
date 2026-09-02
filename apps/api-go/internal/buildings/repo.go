// Package buildings is the persistence layer for the buildings table. Bare
// CRUD only, same scope decision as internal/students.
package buildings

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

func (r *Repository) Create(ctx context.Context, rows []*entities.Building) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("buildings: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, ids, nil)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.Building, len(found))
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

// Find returns buildings matching ids and/or unitIds, or every row when
// both are empty.
func (r *Repository) Find(ctx context.Context, ids []int64, unitIds []int64) ([]*entities.Building, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if len(unitIds) > 0 {
		conds = append(conds, dbx.In("unitId", toInterfaceSlice(unitIds)...))
	}

	q := r.db.WithContext(ctx).Select("*").From("buildings").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.Building
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("buildings: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.Building, error) {
	var row entities.Building
	err := r.db.WithContext(ctx).
		Select("*").
		From("buildings").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("buildings: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.Building, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("buildings: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("buildings", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("buildings: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.Building, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("buildings: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids, nil)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("buildings", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("buildings: delete: %w", err)
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
