// Package materialstocks is the persistence layer for the material_stocks
// table. Bare CRUD only, same scope decision as internal/students.
package materialstocks

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

func (r *Repository) Create(ctx context.Context, rows []*entities.MaterialStock) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("material_stocks: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, ids, nil, 0, 0)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.MaterialStock, len(found))
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

// Find returns material stocks matching ids, unitIds, roomID, and/or
// materialTypeID, or every row when all are empty.
func (r *Repository) Find(ctx context.Context, ids []int64, unitIds []int64, roomID, materialTypeID int64) ([]*entities.MaterialStock, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if len(unitIds) > 0 {
		conds = append(conds, dbx.In("unitId", toInterfaceSlice(unitIds)...))
	}
	if roomID != 0 {
		conds = append(conds, dbx.HashExp{"roomId": roomID})
	}
	if materialTypeID != 0 {
		conds = append(conds, dbx.HashExp{"materialTypeId": materialTypeID})
	}

	q := r.db.WithContext(ctx).Select("*").From("material_stocks").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.MaterialStock
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("material_stocks: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.MaterialStock, error) {
	var row entities.MaterialStock
	err := r.db.WithContext(ctx).
		Select("*").
		From("material_stocks").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("material_stocks: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.MaterialStock, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("material_stocks: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("material_stocks", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("material_stocks: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.MaterialStock, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("material_stocks: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids, nil, 0, 0)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("material_stocks", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("material_stocks: delete: %w", err)
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
