// Package notifications exposes read/mark-as-read endpoints over the
// notifications table plus a live SSE push stream, mirroring
// apps/api/notifications. The pubsub subscription that actually delivers
// live pushes lives here too, since (like apps/api) nothing outside this
// package publishes to topics.NotificationTopic except the students
// service's birthday/CPV cron (not yet ported — see package doc on
// students for the current phase boundary).
package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"encore.app/authn"
	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/logger"
	"encore.app/internal/notifications"
	"encore.app/internal/topics"
	"encore.dev/beta/auth"
	"encore.dev/pubsub"
)

var repo *notifications.Repository
var broadcaster = NewBroadcaster()

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("notifications: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("notifications: run migrations: %w", err))
	}

	repo = notifications.NewRepository(conn)
}

var _ = pubsub.NewSubscription(topics.NotificationTopic, "notification-processor", pubsub.SubscriptionConfig[*topics.NotificationEvent]{
	Handler: func(ctx context.Context, event *topics.NotificationEvent) error {
		logger.InfoContext(ctx, "Processing notification event", "event", event)
		broadcaster.SendToUser(event.UserID, Message{
			Type: string(event.Type),
			Data: MessageData{Title: event.Title, Message: event.Message, UserID: event.UserID},
		})
		return nil
	},
})

type NotificationItemResponse struct {
	ID        int64  `json:"id"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`

	NotifiableType entities.NotifiableType `json:"notifiableType"`
	NotifiableID   int64                   `json:"notifiableId"`

	NotificationID string `json:"notificationId"`
}

type NotificationResponse struct {
	ID        string  `json:"id"`
	CreatedAt string  `json:"createdAt"`
	ReadAt    *string `json:"readAt"`

	NotificationType entities.NotificationType `json:"notificationType"`
	Title            string                    `json:"title"`
	Message          string                    `json:"message"`

	IsBatch    bool    `json:"isBatch"`
	BatchKey   *string `json:"batchKey"`
	TotalCount int     `json:"totalCount"`

	Items []NotificationItemResponse `json:"items"`
}

func toResponse(n *notifications.NotificationWithItems) NotificationResponse {
	items := make([]NotificationItemResponse, len(n.Items))
	for i, it := range n.Items {
		items[i] = NotificationItemResponse{
			ID:             it.ID,
			CreatedAt:      it.CreatedAt,
			UpdatedAt:      it.UpdatedAt,
			NotifiableType: it.NotifiableType,
			NotifiableID:   it.NotifiableID,
			NotificationID: it.NotificationID,
		}
	}
	return NotificationResponse{
		ID:               n.ID,
		CreatedAt:        n.CreatedAt,
		ReadAt:           n.ReadAt,
		NotificationType: n.NotificationType,
		Title:            n.Title,
		Message:          n.Message,
		IsBatch:          n.IsBatch,
		BatchKey:         n.BatchKey,
		TotalCount:       n.TotalCount,
		Items:            items,
	}
}

type GetNotificationsRequest struct {
	Page     int `query:"page"`
	PageSize int `query:"pageSize"`
}

type GetNotificationsResponse struct {
	Data []NotificationResponse `json:"data"`
}

//encore:api auth method=GET path=/notifications
func GetNotifications(ctx context.Context, req *GetNotificationsRequest) (*GetNotificationsResponse, error) {
	page := req.Page
	if page <= 0 {
		page = 0
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	rows, err := repo.Find(ctx, notifications.Query{Page: page, PageSize: pageSize})
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data := make([]NotificationResponse, len(rows))
	for i, r := range rows {
		data[i] = toResponse(r)
	}

	return &GetNotificationsResponse{Data: data}, nil
}

type MarkAsReadRequest struct {
	IDs []string `json:"ids"`
}

type MarkAsReadResponse struct{}

//encore:api auth method=PATCH path=/notifications/mark-as-read
func MarkAsRead(ctx context.Context, req *MarkAsReadRequest) (*MarkAsReadResponse, error) {
	readAt := time.Now().UTC().Format("2006-01-02 15:04:05")
	if _, err := repo.MarkAsRead(ctx, req.IDs, readAt); err != nil {
		return nil, apperr.Wrap(err)
	}
	return &MarkAsReadResponse{}, nil
}

type GetUnreadCountResponse struct {
	Data struct {
		Count int64 `json:"count"`
	} `json:"data"`
}

//encore:api auth method=GET path=/notifications/unread
func GetUnreadCount(ctx context.Context) (*GetUnreadCountResponse, error) {
	count, err := repo.UnreadCount(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}
	resp := &GetUnreadCountResponse{}
	resp.Data.Count = count
	return resp, nil
}

func writeSSE(w http.ResponseWriter, flusher http.Flusher, msg Message) bool {
	b, err := json.Marshal(msg)
	if err != nil {
		return false
	}
	if _, err := fmt.Fprintf(w, "data: %s\n\n", b); err != nil {
		return false
	}
	flusher.Flush()
	return true
}

// NotificationStream is a live SSE push stream for the authenticated user's
// notifications, mirroring apps/api/notifications/notifications.ts's
// NotificationStream (api.streamOut). Unlike the TS version — whose
// Handshake carries an unauthenticated, client-supplied userId — this Go
// port derives the user from the auth token, since Encore Go (SDK
// v1.48.13, see broadcaster.go) has no typed streaming API to port the
// original Handshake-based endpoint onto; a raw SSE endpoint is the closest
// equivalent, and deriving the user from auth is strictly safer than
// trusting the handshake payload.
//
//encore:api auth raw method=GET path=/notifications/stream
func NotificationStream(w http.ResponseWriter, req *http.Request) {
	authData, ok := auth.Data().(*authn.AuthData)
	if !ok || authData == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	userID := authData.UserID

	flusher, ok := w.(http.Flusher)
	if !ok {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	logger.InfoContext(req.Context(), "Starting notification stream", "userId", userID)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ch := make(chan Message, 16)
	broadcaster.AddStream(userID, ch)
	defer broadcaster.RemoveStream(userID, ch)

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	ctx := req.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if !writeSSE(w, flusher, Message{Type: "ping", Data: MessageData{Title: "ping", Message: "ping", UserID: userID}}) {
				return
			}
		case msg := <-ch:
			if !writeSSE(w, flusher, msg) {
				return
			}
		}
	}
}
