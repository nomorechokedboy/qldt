// Package apperr is this app's error wrapper around encore.dev/beta/errs —
// the same idiom apps/sms-api/authn/controller.go uses (errs.WrapCode, which
// preserves the original error as Unwrap()'able cause and stack trace,
// instead of a bare &errs.Error{} that loses both).
//
// Domain/repo code returns plain errors built from the sentinels below
// (fmt.Errorf("...: %w", apperr.ErrNotFound)); API handlers call Wrap once at
// the boundary to turn that into the right *errs.Error for the client.
package apperr

import (
	"database/sql"
	"errors"
	"fmt"

	"encore.dev/beta/errs"
)

var (
	ErrNotFound         = errors.New("not found")
	ErrInvalidArgument  = errors.New("invalid argument")
	ErrAlreadyExists    = errors.New("already exists")
	ErrPermissionDenied = errors.New("permission denied")
	ErrUnauthenticated  = errors.New("unauthenticated")
	ErrUnimplemented    = errors.New("unimplemented")
)

func NotFound(format string, a ...any) error {
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, a...), ErrNotFound)
}

func InvalidArgument(format string, a ...any) error {
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, a...), ErrInvalidArgument)
}

func AlreadyExists(format string, a ...any) error {
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, a...), ErrAlreadyExists)
}

func PermissionDenied(format string, a ...any) error {
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, a...), ErrPermissionDenied)
}

func Unauthenticated(format string, a ...any) error {
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, a...), ErrUnauthenticated)
}

// Wrap converts any domain error into an *errs.Error with the right Code for
// the client, via errs.WrapCode so the original error/stack survives as the
// cause instead of being discarded. Safe to call on an error that's already
// an *errs.Error (WrapCode leaves the code alone via errs.Code lookups) or on
// nil (returns nil). Call this once, at the API handler boundary — not in
// repos or use cases.
func Wrap(err error) error {
	if err == nil {
		return nil
	}

	code := errs.Internal
	switch {
	case errors.Is(err, ErrNotFound), errors.Is(err, sql.ErrNoRows):
		code = errs.NotFound
	case errors.Is(err, ErrInvalidArgument):
		code = errs.InvalidArgument
	case errors.Is(err, ErrAlreadyExists):
		code = errs.AlreadyExists
	case errors.Is(err, ErrPermissionDenied):
		code = errs.PermissionDenied
	case errors.Is(err, ErrUnauthenticated):
		code = errs.Unauthenticated
	case errors.Is(err, ErrUnimplemented):
		code = errs.Unimplemented
	}

	return errs.WrapCode(err, code, err.Error())
}
