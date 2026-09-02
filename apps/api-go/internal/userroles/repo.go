// Package userroles is the persistence layer for the user_roles join table
// (composite PK user_id+role_id, no own id column, so it gets
// assign/list/remove instead of generic id-keyed CRUD).
package userroles

import (
	"context"
	"fmt"
	"strings"

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

// Assign links userID to each of roleIDs, ignoring pairs that are already
// assigned.
func (r *Repository) Assign(ctx context.Context, userID int64, roleIDs []int64) error {
	if len(roleIDs) == 0 {
		return apperr.InvalidArgument("user_roles: assign: no role ids provided")
	}

	for _, roleID := range roleIDs {
		_, err := r.db.WithContext(ctx).
			Insert("user_roles", dbx.Params{
				"user_id": userID,
				"role_id": roleID,
			}).
			Execute()
		if err != nil {
			if isUniqueConstraintErr(err) {
				continue
			}
			return fmt.Errorf("user_roles: assign: %w", err)
		}
	}

	return nil
}

// ListByUser returns every role assignment for userID.
func (r *Repository) ListByUser(ctx context.Context, userID int64) ([]*entities.UserRole, error) {
	var rows []*entities.UserRole
	err := r.db.WithContext(ctx).
		Select("*").
		From("user_roles").
		Where(dbx.HashExp{"user_id": userID}).
		OrderBy("role_id").
		All(&rows)
	if err != nil {
		return nil, fmt.Errorf("user_roles: list by user: %w", err)
	}

	return rows, nil
}

// Remove unlinks userID from each of roleIDs.
func (r *Repository) Remove(ctx context.Context, userID int64, roleIDs []int64) error {
	if len(roleIDs) == 0 {
		return apperr.InvalidArgument("user_roles: remove: no role ids provided")
	}

	_, err := r.db.WithContext(ctx).
		Delete("user_roles", dbx.And(
			dbx.HashExp{"user_id": userID},
			dbx.In("role_id", toInterfaceSlice(roleIDs)...),
		)).
		Execute()
	if err != nil {
		return fmt.Errorf("user_roles: remove: %w", err)
	}

	return nil
}

func isUniqueConstraintErr(err error) bool {
	return err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed")
}

func toInterfaceSlice[T any](in []T) []interface{} {
	out := make([]interface{}, len(in))
	for i, v := range in {
		out[i] = v
	}
	return out
}
