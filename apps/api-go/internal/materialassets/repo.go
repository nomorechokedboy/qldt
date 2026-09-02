// Package materialassets is the persistence layer for the material_assets
// table. Bare CRUD only, same scope decision as internal/students.
package materialassets

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

func (r *Repository) Create(ctx context.Context, rows []*entities.MaterialAsset) error {
	for _, row := range rows {
		if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
			return fmt.Errorf("material_assets: insert: %w", err)
		}
	}

	ids := make([]int64, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}

	found, err := r.Find(ctx, Filter{Ids: ids})
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.MaterialAsset, len(found))
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

// Filter narrows Find; zero values mean "no filter" for that field.
type Filter struct {
	Ids               []int64
	UnitIds           []int64
	RoomID            int64
	MaterialTypeID    int64
	Status            entities.MaterialAssetStatus
	AssignedTrooperID int64
}

func (r *Repository) Find(ctx context.Context, f Filter) ([]*entities.MaterialAsset, error) {
	var conds []dbx.Expression
	if len(f.Ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(f.Ids)...))
	}
	if len(f.UnitIds) > 0 {
		conds = append(conds, dbx.In("unitId", toInterfaceSlice(f.UnitIds)...))
	}
	if f.RoomID != 0 {
		conds = append(conds, dbx.HashExp{"roomId": f.RoomID})
	}
	if f.MaterialTypeID != 0 {
		conds = append(conds, dbx.HashExp{"materialTypeId": f.MaterialTypeID})
	}
	if f.Status != "" {
		conds = append(conds, dbx.HashExp{"status": f.Status})
	}
	if f.AssignedTrooperID != 0 {
		conds = append(conds, dbx.HashExp{"assignedTrooperId": f.AssignedTrooperID})
	}

	q := r.db.WithContext(ctx).Select("*").From("material_assets").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.MaterialAsset
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("material_assets: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.MaterialAsset, error) {
	var row entities.MaterialAsset
	err := r.db.WithContext(ctx).
		Select("*").
		From("material_assets").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("material_assets: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.MaterialAsset, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("material_assets: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("material_assets", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("material_assets: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.MaterialAsset, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("material_assets: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, Filter{Ids: ids})
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("material_assets", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("material_assets: delete: %w", err)
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
