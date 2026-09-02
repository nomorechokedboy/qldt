// Package students is the persistence layer for the students table. It is
// deliberately a plain CRUD repository — no classId/unitId ownership
// validation, joins, or side effects (that lives in apps/api today and will
// be ported in a later pass, see apps/api-go/README.md).
package students

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

// Create inserts each student and returns the rows with their generated IDs
// and defaulted columns populated.
func (r *Repository) Create(ctx context.Context, students []*entities.Student) error {
	for _, s := range students {
		if err := r.db.WithContext(ctx).Model(s).Insert(); err != nil {
			return fmt.Errorf("students: insert: %w", err)
		}
	}

	ids := make([]int64, len(students))
	for i, s := range students {
		ids[i] = s.ID
	}

	found, err := r.Find(ctx, ids)
	if err != nil {
		return err
	}

	byID := make(map[int64]*entities.Student, len(found))
	for _, s := range found {
		byID[s.ID] = s
	}
	for i, s := range students {
		if fresh, ok := byID[s.ID]; ok {
			*students[i] = *fresh
		}
	}

	return nil
}

// Find returns students matching ids, or every student when ids is empty.
func (r *Repository) Find(ctx context.Context, ids []int64) ([]*entities.Student, error) {
	q := r.db.WithContext(ctx).Select("*").From("students")
	if len(ids) > 0 {
		q = q.Where(dbx.In("id", toInterfaceSlice(ids)...))
	}
	q = q.OrderBy("id")

	var rows []*entities.Student
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("students: find: %w", err)
	}

	return rows, nil
}

// FindOne returns a single student by id.
func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.Student, error) {
	var row entities.Student
	err := r.db.WithContext(ctx).
		Select("*").
		From("students").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("students: find one: %w", err)
	}

	return &row, nil
}

// Update applies a partial column update (only the keys present in cols are
// changed) and returns the row as it stands after the update.
func (r *Repository) Update(ctx context.Context, id int64, cols dbx.Params) (*entities.Student, error) {
	if len(cols) == 0 {
		return nil, apperr.InvalidArgument("students: update: no columns provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("students", cols, dbx.HashExp{"id": id}).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("students: update: %w", err)
	}

	return r.FindOne(ctx, id)
}

// UpdateStatus bulk-updates the status column for the given ids and returns
// the affected rows.
func (r *Repository) UpdateStatus(ctx context.Context, ids []int64, status entities.Status) ([]*entities.Student, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("students: update status: no ids provided")
	}

	_, err := r.db.WithContext(ctx).
		Update("students", dbx.Params{"status": string(status)}, dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("students: update status: %w", err)
	}

	return r.Find(ctx, ids)
}

// Delete removes the given ids and returns the rows as they were just
// before deletion.
func (r *Repository) Delete(ctx context.Context, ids []int64) ([]*entities.Student, error) {
	if len(ids) == 0 {
		return nil, apperr.InvalidArgument("students: delete: no ids provided")
	}

	deleted, err := r.Find(ctx, ids)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).
		Delete("students", dbx.In("id", toInterfaceSlice(ids)...)).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("students: delete: %w", err)
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
