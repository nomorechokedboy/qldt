// Package materialassetevents is the persistence layer for the
// material_asset_events table. apps/api/schema/material-asset-events.ts
// exposes no update/delete type — it's an append-only audit trail — so this
// repo only supports Create/Find/FindOne, unlike the other bare-CRUD repos.
package materialassetevents

import (
	"context"
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type Repository struct {
	db *dbx.DB
}

func NewRepository(db *dbx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, rows []*entities.MaterialAssetEvent) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("material_asset_events: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, ids, 0)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.MaterialAssetEvent, len(found))
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

// Find returns events matching ids and/or assetID, or every row when both
// are empty.
func (r *Repository) Find(ctx context.Context, ids []int64, assetID int64) ([]*entities.MaterialAssetEvent, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if assetID != 0 {
		conds = append(conds, dbx.HashExp{"assetId": assetID})
	}

	q := r.db.WithContext(ctx).Select("*").From("material_asset_events").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.MaterialAssetEvent
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("material_asset_events: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.MaterialAssetEvent, error) {
	var row entities.MaterialAssetEvent
	err := r.db.WithContext(ctx).
		Select("*").
		From("material_asset_events").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("material_asset_events: find one: %w", err)
	}

	return &row, nil
}

func toInterfaceSlice[T any](in []T) []interface{} {
	out := make([]interface{}, len(in))
	for i, v := range in {
		out[i] = v
	}
	return out
}
