// Package auditlogs is the persistence layer for the audit_logs table.
// Rows are only ever written by the pubsub subscription in
// auditlogs/auditlogs.go, never directly by an API handler, so — like
// internal/materialassetevents — this repo only supports Create/Find, no
// Update/Delete.
package auditlogs

import (
	"context"
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

type Repository struct {
	db *dbx.DB
}

func NewRepository(db *dbx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, row *entities.AuditLog) error {
	if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
		return fmt.Errorf("audit_logs: insert: %w", err)
	}
	return nil
}

// Query narrows Find; zero values mean "no filter" for that field.
type Query struct {
	Resource    string
	Action      entities.AuditAction
	ActorUserID int64
	From        string
	To          string
	Page        int
	PageSize    int
}

const defaultPageSize = 20

func (r *Repository) Find(ctx context.Context, q Query) (rows []*entities.AuditLog, total int64, err error) {
	var conds []dbx.Expression
	if q.Resource != "" {
		conds = append(conds, dbx.HashExp{"resource": q.Resource})
	}
	if q.Action != "" {
		conds = append(conds, dbx.HashExp{"action": q.Action})
	}
	if q.ActorUserID != 0 {
		conds = append(conds, dbx.HashExp{"actorUserId": q.ActorUserID})
	}
	if q.From != "" {
		conds = append(conds, dbx.NewExp("createdAt >= {:from}", dbx.Params{"from": q.From}))
	}
	if q.To != "" {
		conds = append(conds, dbx.NewExp("createdAt <= {:to}", dbx.Params{"to": q.To}))
	}

	page := q.Page
	if page <= 0 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 {
		pageSize = defaultPageSize
	}

	where := dbx.Expression(nil)
	if len(conds) > 0 {
		where = dbx.And(conds...)
	}

	countQ := r.db.WithContext(ctx).Select("COUNT(*)").From("audit_logs")
	if where != nil {
		countQ = countQ.Where(where)
	}
	if err := countQ.Row(&total); err != nil {
		return nil, 0, fmt.Errorf("audit_logs: count: %w", err)
	}

	dataQ := r.db.WithContext(ctx).Select("*").From("audit_logs").
		OrderBy("createdAt DESC").
		Limit(int64(pageSize)).
		Offset(int64((page - 1) * pageSize))
	if where != nil {
		dataQ = dataQ.Where(where)
	}
	if err := dataQ.All(&rows); err != nil {
		return nil, 0, fmt.Errorf("audit_logs: find: %w", err)
	}

	return rows, total, nil
}
