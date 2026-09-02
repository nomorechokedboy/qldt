// Package auditctx threads per-request audit details from an API handler
// back to the audit middleware, mirroring apps/api/middleware/audit.ts's
// setAuditContext/currentRequest().middlewareData pattern. Go's middleware
// has no built-in per-request mutable scratch space, so the middleware
// stores a pointer in the request context before calling next(); the
// handler mutates that same pointer via SetContext, and the middleware
// reads it back after next() returns.
package auditctx

import "context"

type Data struct {
	ResourceIds   []any
	PreviousValue any
	NewValue      any
	Set           bool
}

type ctxKey struct{}

// WithData returns a context carrying a fresh, empty *Data the middleware
// can read back after the handler runs.
func WithData(ctx context.Context) (context.Context, *Data) {
	d := &Data{}
	return context.WithValue(ctx, ctxKey{}, d), d
}

// SetContext is called by handlers, before returning, to record what a
// mutation touched. resourceIds should be the affected rows' ids.
func SetContext(ctx context.Context, resourceIds []any, previousValue, newValue any) {
	d, ok := ctx.Value(ctxKey{}).(*Data)
	if !ok {
		return
	}
	d.ResourceIds = resourceIds
	d.PreviousValue = previousValue
	d.NewValue = newValue
	d.Set = true
}
