// Package authn wires the internal JWT verifier up as this app's Encore
// auth handler. It only verifies tokens issued by apps/api's auth service —
// login/refresh/change-password stay in the TS app for now.
package authn

import (
	"context"
	"strconv"
	"strings"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/authn"
	"encore.dev/beta/auth"
)

// AuthData is what handlers get back from auth.Data() after a request is
// authenticated.
type AuthData struct {
	UserID      int64
	Permissions []string
	IsSuperUser bool
}

//encore:authhandler
func AuthHandler(ctx context.Context, token string) (auth.UID, *AuthData, error) {
	token = strings.TrimPrefix(token, "Bearer ")
	if token == "" {
		return "", nil, apperr.Wrap(apperr.Unauthenticated("no token provided"))
	}

	payload, err := authn.Verify(token, config.Get().JWTPrivateKey)
	if err != nil {
		return "", nil, apperr.Wrap(apperr.Unauthenticated("invalid token: %v", err))
	}

	return auth.UID(strconv.FormatInt(payload.UserID, 10)), &AuthData{
		UserID:      payload.UserID,
		Permissions: payload.Permissions,
		IsSuperUser: payload.IsSuperUser,
	}, nil
}
