// Package rolepermissions is the persistence layer for the role_permissions
// join table (composite PK role_id+permission_id, no own id column, so it
// gets assign/list/remove instead of generic id-keyed CRUD).
package rolepermissions

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

// Assign links roleID to each of permissionIDs, ignoring pairs that are
// already assigned.
func (r *Repository) Assign(ctx context.Context, roleID int64, permissionIDs []int64) error {
	if len(permissionIDs) == 0 {
		return apperr.InvalidArgument("role_permissions: assign: no permission ids provided")
	}

	for _, permissionID := range permissionIDs {
		_, err := r.db.WithContext(ctx).
			Insert("role_permissions", dbx.Params{
				"role_id":       roleID,
				"permission_id": permissionID,
			}).
			Execute()
		if err != nil {
			// A repeat assignment hits the composite primary key and fails
			// with a UNIQUE constraint error — treat that as a no-op.
			if isUniqueConstraintErr(err) {
				continue
			}
			return fmt.Errorf("role_permissions: assign: %w", err)
		}
	}

	return nil
}

// ListByRole returns every permission assignment for roleID.
func (r *Repository) ListByRole(ctx context.Context, roleID int64) ([]*entities.RolePermission, error) {
	var rows []*entities.RolePermission
	err := r.db.WithContext(ctx).
		Select("*").
		From("role_permissions").
		Where(dbx.HashExp{"role_id": roleID}).
		OrderBy("permission_id").
		All(&rows)
	if err != nil {
		return nil, fmt.Errorf("role_permissions: list by role: %w", err)
	}

	return rows, nil
}

// Remove unlinks roleID from each of permissionIDs.
func (r *Repository) Remove(ctx context.Context, roleID int64, permissionIDs []int64) error {
	if len(permissionIDs) == 0 {
		return apperr.InvalidArgument("role_permissions: remove: no permission ids provided")
	}

	_, err := r.db.WithContext(ctx).
		Delete("role_permissions", dbx.And(
			dbx.HashExp{"role_id": roleID},
			dbx.In("permission_id", toInterfaceSlice(permissionIDs)...),
		)).
		Execute()
	if err != nil {
		return fmt.Errorf("role_permissions: remove: %w", err)
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
