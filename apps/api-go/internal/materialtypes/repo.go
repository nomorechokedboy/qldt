// Package materialtypes is the persistence layer for the material_types
// table. Bare CRUD only, same scope decision as internal/students.
package materialtypes

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

func (r *Repository) Create(ctx context.Context, rows []*entities.MaterialType) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("material_types: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, ids, "")
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.MaterialType, len(found))
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

// Find returns material types matching ids and/or category, or every row
// when both are empty.
func (r *Repository) Find(ctx context.Context, ids []int64, category entities.MaterialCategory) ([]*entities.MaterialType, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if category != "" {
		conds = append(conds, dbx.HashExp{"category": category})
	}

	q := r.db.WithContext(ctx).Select("*").From("material_types").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.MaterialType
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("material_types: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.MaterialType, error) {
	var row entities.MaterialType
	err := r.db.WithContext(ctx).
		Select("*").
		From("material_types").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("material_types: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.MaterialType, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("material_types: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("material_types", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("material_types: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.MaterialType, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("material_types: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids, "")
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("material_types", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("material_types: delete: %w", err)
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
