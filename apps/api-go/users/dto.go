package users

import (
	"fmt"

	"encore.app/internal/authn"
	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

// CreateUserInput mirrors apps/api's users/controller.ts CreateUserRequest,
// minus roleIds (role assignment lives in the userroles package).
type CreateUserInput struct {
	Username    string  `json:"username"`
	Password    string  `json:"password"`
	DisplayName string  `json:"displayName"`
	UnitID      *int64  `json:"unitId,omitempty"`
	IsSuperUser bool    `json:"isSuperUser,omitempty"`
	Rank        *string `json:"rank,omitempty"`
	Position    *string `json:"position,omitempty"`
	Alias       *string `json:"alias,omitempty"`
}

func (in CreateUserInput) toEntity() (*entities.User, error) {
	hash, err := authn.HashPassword(in.Password)
	if err != nil {
		return nil, fmt.Errorf("users: hash password: %w", err)
	}

	return &entities.User{
		Username:    in.Username,
		Password:    hash,
		DisplayName: in.DisplayName,
		IsSuperUser: in.IsSuperUser,
		UnitID:      in.UnitID,
		Status:      entities.UserStatusPending,
		Rank:        in.Rank,
		Position:    in.Position,
		Alias:       in.Alias,
	}, nil
}

// updatableColumns is every users column an UpdateUsers caller is allowed
// to touch (everything except pk/createdAt/updatedAt/username — usernames
// are immutable here, matching apps/api not exposing a rename path).
var updatableColumns = map[string]bool{
	"password": true, "displayName": true, "isSuperUser": true, "unitId": true,
	"status": true, "rank": true, "position": true, "alias": true,
}

// toUpdateParams keeps only the recognized, non-nil columns from a partial
// update payload, hashing `password` if present rather than storing it raw.
func toUpdateParams(data map[string]any) (dbx.Params, error) {
	cols := dbx.Params{}
	for k, v := range data {
		if v == nil || !updatableColumns[k] {
			continue
		}

		if k == "password" {
			raw, ok := v.(string)
			if !ok {
				return nil, fmt.Errorf("users: password must be a string")
			}
			hash, err := authn.HashPassword(raw)
			if err != nil {
				return nil, fmt.Errorf("users: hash password: %w", err)
			}
			cols[k] = hash
			continue
		}

		cols[k] = v
	}
	return cols, nil
}
