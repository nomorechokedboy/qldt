// Package auditlogs exposes a read-only GET /audit-logs endpoint and the
// pubsub subscription that actually writes rows, mirroring apps/api's
// audit-logs service. There is no public create endpoint — rows only ever
// arrive via internal/topics.AuditLogTopic, published by middleware/audit.go.
package auditlogs

import (
	"context"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditlogs"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/topics"
	"encore.dev/pubsub"
)

var repo *auditlogs.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("auditlogs: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("auditlogs: run migrations: %w", err))
	}

	repo = auditlogs.NewRepository(conn)
}

var _ = pubsub.NewSubscription(topics.AuditLogTopic, "audit-log-writer", pubsub.SubscriptionConfig[*topics.AuditLogEvent]{
	Handler: writeAuditLog,
})

func writeAuditLog(ctx context.Context, event *topics.AuditLogEvent) error {
	return repo.Create(ctx, &entities.AuditLog{
		ActorUserID:   event.ActorUserID,
		Resource:      event.Resource,
		Action:        entities.AuditAction(event.Action),
		ResourceIds:   event.ResourceIds,
		Method:        event.Method,
		Path:          event.Path,
		StatusCode:    event.StatusCode,
		PreviousValue: event.PreviousValue,
		NewValue:      event.NewValue,
	})
}

type GetAuditLogsRequest struct {
	Resource    string `query:"resource"`
	Action      string `query:"action"`
	ActorUserID int64  `query:"actorUserId"`
	From        string `query:"from"`
	To          string `query:"to"`
	Page        int    `query:"page"`
	PageSize    int    `query:"pageSize"`
}

type GetAuditLogsResponse struct {
	Data  []*entities.AuditLog `json:"data"`
	Total int64                `json:"total"`
}

//encore:api auth method=GET path=/audit-logs
func GetAuditLogs(ctx context.Context, req *GetAuditLogsRequest) (*GetAuditLogsResponse, error) {
	if req.Action != "" && !entities.AuditAction(req.Action).Valid() {
		return nil, apperr.Wrap(apperr.InvalidArgument("invalid action: %q", req.Action))
	}

	rows, total, err := repo.Find(ctx, auditlogs.Query{
		Resource:    req.Resource,
		Action:      entities.AuditAction(req.Action),
		ActorUserID: req.ActorUserID,
		From:        req.From,
		To:          req.To,
		Page:        req.Page,
		PageSize:    req.PageSize,
	})
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &GetAuditLogsResponse{Data: rows, Total: total}, nil
}
