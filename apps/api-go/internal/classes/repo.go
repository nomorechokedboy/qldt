// Package classes is the persistence layer for the classes table. Bare CRUD
// only, same scope decision as internal/students — see apps/api-go/README.md.
package classes

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

// Create inserts each class and returns the rows with generated IDs and
// defaulted columns populated.
func (r *Repository) Create(ctx context.Context, classes []*entities.Class) error {
	for _, c := range classes {
		if err := r.db.WithContext(ctx).Model(c).Insert(); err != nil {
			return fmt.Errorf("classes: insert: %w", err)
		}
	}

	ids := make([]int64, len(classes))
	for i, c := range classes {
		ids[i] = c.ID
	}

	found, err := r.Find(ctx, ids, nil)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.Class, len(found))
	for _, c := range found {
		byID[c.ID] = c
	}
	for i, c := range classes {
		if fresh, ok := byID[c.ID]; ok {
			*classes[i] = *fresh
		}
	}

	return nil
}

// Find returns classes matching ids and/or unitIds, or every class when
// both are empty.
func (r *Repository) Find(ctx context.Context, ids []int64, unitIds []int64) ([]*entities.Class, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if len(unitIds) > 0 {
		conds = append(conds, dbx.In("unitId", toInterfaceSlice(unitIds)...))
	}

	q := r.db.WithContext(ctx).Select("*").From("classes").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.Class
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("classes: find: %w", err)
	}

	return rows, nil
}

// FindOne returns a single class by id.
func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.Class, error) {
	var row entities.Class
	err := r.db.WithContext(ctx).
		Select("*").
		From("classes").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("classes: find one: %w", err)
	}

	return &row, nil
}

// Update applies a partial column update and returns the row as it stands
// afterward.
func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.Class, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("classes: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("classes", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("classes: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

// Delete removes the given ids and returns the rows as they were just
// before deletion.
func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.Class, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("classes: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids, nil)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("classes", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("classes: delete: %w", err)
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
