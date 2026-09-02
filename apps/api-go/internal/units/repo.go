// Package units is the persistence layer for the units table. Bare CRUD
// only, same scope decision as internal/students — see apps/api-go/README.md.
package units

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

// Create inserts each unit and returns the rows with generated IDs and
// defaulted columns populated.
func (r *Repository) Create(ctx context.Context, units []*entities.Unit) error {
	for _, u := range units {
		if err := r.db.WithContext(ctx).Model(u).Insert(); err != nil {
			return fmt.Errorf("units: insert: %w", err)
		}
	}

	ids := make([]int64, len(units))
	for i, u := range units {
		ids[i] = u.ID
	}

	found, err := r.Find(ctx, ids, "")
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.Unit, len(found))
	for _, u := range found {
		byID[u.ID] = u
	}
	for i, u := range units {
		if fresh, ok := byID[u.ID]; ok {
			*units[i] = *fresh
		}
	}

	return nil
}

// Find returns units matching ids and/or level, or every unit when both are
// empty.
func (r *Repository) Find(ctx context.Context, ids []int64, level entities.UnitLevel) ([]*entities.Unit, error) {
	var conds []dbx.Expression
	if len(ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(ids)...))
	}
	if level != "" {
		conds = append(conds, dbx.HashExp{"level": level})
	}

	q := r.db.WithContext(ctx).Select("*").From("units").OrderBy("id")
	if len(conds) > 0 {
		q = q.Where(dbx.And(conds...))
	}

	var rows []*entities.Unit
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("units: find: %w", err)
	}

	return rows, nil
}

// FindOne returns a single unit by id.
func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.Unit, error) {
	var row entities.Unit
	err := r.db.WithContext(ctx).
		Select("*").
		From("units").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("units: find one: %w", err)
	}

	return &row, nil
}

// Update applies a partial column update and returns the row as it stands
// afterward.
func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.Unit, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("units: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("units", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("units: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

// Delete removes the given ids and returns the rows as they were just
// before deletion.
func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.Unit, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("units: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids, "")
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("units", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("units: delete: %w", err)
	}

	return deleted, nil
}

// FindAncestorChain returns unitID's own row followed by every ancestor up
// to the root, walking parentId. Mirrors apps/api/units/repo.ts's
// findAncestorChain.
func (r *Repository) FindAncestorChain(ctx context.Context, unitID int64) ([]*entities.Unit, error) {
	var chain []*entities.Unit
	currentID := &unitID
	for currentID != nil {
		u, err := r.FindOne(ctx, *currentID)
		if err != nil {
			return nil, fmt.Errorf("units: find ancestor chain: %w", err)
		}
		chain = append(chain, u)
		currentID = u.ParentID
	}
	return chain, nil
}

// FindDescendantUnitIds returns rootID plus every descendant unit id,
// mirroring apps/api/units/stats-repo.ts's findDescendantUnitIds.
func (r *Repository) FindDescendantUnitIds(ctx context.Context, rootID int64) ([]int64, error) {
	all, err := r.Find(ctx, nil, "")
	if err != nil {
		return nil, fmt.Errorf("units: find descendant unit ids: %w", err)
	}

	childrenByParent := make(map[int64][]int64)
	for _, u := range all {
		if u.ParentID == nil {
			continue
		}
		childrenByParent[*u.ParentID] = append(childrenByParent[*u.ParentID], u.ID)
	}

	result := []int64{rootID}
	queue := []int64{rootID}
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		for _, childID := range childrenByParent[current] {
			result = append(result, childID)
			queue = append(queue, childID)
		}
	}

	return result, nil
}

func toInterfaceSlice[T any](in []T) []interface{} {
	out := make([]interface{}, len(in))
	for i, v := range in {
		out[i] = v
	}
	return out
}
