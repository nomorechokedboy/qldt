// Package notifications is the persistence layer for the notifications and
// notification_items tables, mirroring apps/api/notifications/repo.ts.
package notifications

import (
	"context"
	"fmt"

	"encore.app/internal/entities"
	"encore.app/internal/idgen"
	"github.com/pocketbase/dbx"
)

type Repository struct {
	db *dbx.DB
}

func NewRepository(db *dbx.DB) *Repository {
	return &Repository{db: db}
}

// CreateParams mirrors apps/api/schema/notifications.ts's
// CreateNotificationParams.
type CreateParams struct {
	NotificationType entities.NotificationType
	Title            string
	Message          string
	RecipientID      *int64
	ActorID          *int64
	IsBatch          bool
	BatchKey         *string
	TotalCount       int
}

func (r *Repository) Create(ctx context.Context, params []CreateParams) ([]*entities.Notification, error) {
	rows := make([]*entities.Notification, 0, len(params))
	err := r.db.TransactionalContext(ctx, nil, func(tx *dbx.Tx) error {
		for _, p := range params {
			row := newNotificationRow(p)
			if err := tx.Model(row).Insert(); err != nil {
				return err
			}
			rows = append(rows, row)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("notifications: create: %w", err)
	}
	return rows, nil
}

// BatchItem mirrors apps/api/schema/notifications.ts's
// CreateBatchNotificationItemData entry.
type BatchItem struct {
	NotifiableType entities.NotifiableType
	NotifiableID   int64
}

// CreateBatchParams mirrors apps/api/schema/notifications.ts's
// CreateBatchNotificationData.
type CreateBatchParams struct {
	NotificationType entities.NotificationType
	Title            string
	Message          string
	RecipientID      *int64
	ActorID          *int64
	BatchKey         string
	Items            []BatchItem
}

func (r *Repository) CreateBatch(ctx context.Context, p CreateBatchParams) (*entities.Notification, error) {
	batchKey := p.BatchKey
	row := newNotificationRow(CreateParams{
		NotificationType: p.NotificationType,
		Title:            p.Title,
		Message:          p.Message,
		RecipientID:      p.RecipientID,
		ActorID:          p.ActorID,
		IsBatch:          true,
		BatchKey:         &batchKey,
		TotalCount:       len(p.Items),
	})

	err := r.db.TransactionalContext(ctx, nil, func(tx *dbx.Tx) error {
		if err := tx.Model(row).Insert(); err != nil {
			return err
		}

		for _, item := range p.Items {
			itemRow := &entities.NotificationItem{
				NotifiableType: item.NotifiableType,
				NotifiableID:   item.NotifiableID,
				NotificationID: row.ID,
			}
			if err := tx.Model(itemRow).Insert(); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("notifications: create batch: %w", err)
	}
	return row, nil
}

func newNotificationRow(p CreateParams) *entities.Notification {
	totalCount := p.TotalCount
	if totalCount == 0 {
		totalCount = 1
	}
	return &entities.Notification{
		ID:               idgen.UUID(),
		NotificationType: p.NotificationType,
		Title:            p.Title,
		Message:          p.Message,
		RecipientID:      p.RecipientID,
		ActorID:          p.ActorID,
		IsBatch:          p.IsBatch,
		BatchKey:         p.BatchKey,
		TotalCount:       totalCount,
	}
}

// Query narrows Find; zero values mean "no filter" for that field.
type Query struct {
	Page     int
	PageSize int
}

// NotificationWithItems is a Notification plus its notification_items rows,
// mirroring apps/api/schema/notifications.ts's Notification type (Drizzle's
// `with: { items: true }`).
type NotificationWithItems struct {
	*entities.Notification
	Items []*entities.NotificationItem `json:"items"`
}

func (r *Repository) Find(ctx context.Context, q Query) ([]*NotificationWithItems, error) {
	page := q.Page
	if page < 0 {
		page = 0
	}
	pageSize := q.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	var notis []*entities.Notification
	err := r.db.WithContext(ctx).Select("*").From("notifications").
		OrderBy("createdAt DESC").
		Limit(int64(pageSize)).
		Offset(int64(page * pageSize)).
		All(&notis)
	if err != nil {
		return nil, fmt.Errorf("notifications: find: %w", err)
	}

	result := make([]*NotificationWithItems, len(notis))
	for i, n := range notis {
		result[i] = &NotificationWithItems{Notification: n}
	}
	if len(notis) == 0 {
		return result, nil
	}

	ids := make([]any, len(notis))
	byID := make(map[string]*NotificationWithItems, len(notis))
	for i, n := range notis {
		ids[i] = n.ID
		byID[n.ID] = result[i]
	}

	var items []*entities.NotificationItem
	err = r.db.WithContext(ctx).Select("*").From("notification_items").
		Where(dbx.In("notificationId", ids...)).
		All(&items)
	if err != nil {
		return nil, fmt.Errorf("notifications: find items: %w", err)
	}

	for _, item := range items {
		if n, ok := byID[item.NotificationID]; ok {
			n.Items = append(n.Items, item)
		}
	}

	return result, nil
}

func (r *Repository) MarkAsRead(ctx context.Context, ids []string, readAt string) ([]*entities.Notification, error) {
	updated := make([]*entities.Notification, 0, len(ids))
	err := r.db.TransactionalContext(ctx, nil, func(tx *dbx.Tx) error {
		for _, id := range ids {
			row := &entities.Notification{}
			if err := tx.Select("*").From("notifications").Where(dbx.HashExp{"id": id}).One(row); err != nil {
				return err
			}
			row.ReadAt = &readAt
			if err := tx.Model(row).Update(); err != nil {
				return err
			}
			updated = append(updated, row)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("notifications: mark as read: %w", err)
	}
	return updated, nil
}

func (r *Repository) UnreadCount(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Select("COUNT(*)").From("notifications").
		Where(dbx.NewExp("readAt IS NULL")).
		Row(&count)
	if err != nil {
		return 0, fmt.Errorf("notifications: unread count: %w", err)
	}
	return count, nil
}
