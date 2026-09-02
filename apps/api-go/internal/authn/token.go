// Package authn verifies the HS256 access tokens issued by apps/api's auth
// service (jsonwebtoken), so this app can be exercised with the same login
// flow instead of standing up a parallel one.
package authn

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

const (
	issuer   = "cdhc2-student-management-api"
	audience = "cdhc2-student-management-web"
)

var (
	ErrInvalidToken = errors.New("authn: invalid token")
	ErrTokenExpired = errors.New("authn: token expired")
	ErrWrongType    = errors.New("authn: wrong token type")
)

// TokenPayload mirrors auth/controller.ts's TokenPayload.
type TokenPayload struct {
	UserID      int64    `json:"userId"`
	IsSuperUser bool     `json:"isSuperUser"`
	Status      string   `json:"status"`
	Permissions []string `json:"permissions"`
	Type        string   `json:"type"`
	jwt.RegisteredClaims
}

// Verify parses and validates token, requiring it to be an access token
// signed with secret using the same issuer/audience apps/api uses.
func Verify(token, secret string) (*TokenPayload, error) {
	claims := &TokenPayload{}

	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	}, jwt.WithIssuer(issuer), jwt.WithAudience(audience))

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	if !parsed.Valid {
		return nil, ErrInvalidToken
	}

	if claims.Type != "access" {
		return nil, ErrWrongType
	}

	return claims, nil
}
