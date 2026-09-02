package notifications

import "sync"

// Message mirrors apps/api/notifications/notifications.ts's Message —
// the payload pushed to a live-connected client.
type Message struct {
	Type string      `json:"type"`
	Data MessageData `json:"data"`
}

type MessageData struct {
	Title   string `json:"title"`
	Message string `json:"message"`
	UserID  int64  `json:"userId"`
}

// Broadcaster fans a Message out to every live connection for a user.
//
// apps/api/notifications/broadcaster.ts holds a StreamOut[Message] per
// connection and calls stream.send(). This Go SDK version (encore.dev
// v1.48.13) has no equivalent typed streaming API, so NotificationStream
// (notifications.go) is a raw SSE endpoint instead of a generated stream —
// each connection registers a buffered channel here instead of a
// StreamOut, and the SSE handler drains it.
type Broadcaster struct {
	mu      sync.Mutex
	streams map[int64][]chan Message
}

func NewBroadcaster() *Broadcaster {
	return &Broadcaster{streams: make(map[int64][]chan Message)}
}

func (b *Broadcaster) AddStream(userID int64, ch chan Message) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.streams[userID] = append(b.streams[userID], ch)
}

func (b *Broadcaster) RemoveStream(userID int64, ch chan Message) {
	b.mu.Lock()
	defer b.mu.Unlock()
	streams := b.streams[userID]
	for i, s := range streams {
		if s == ch {
			b.streams[userID] = append(streams[:i], streams[i+1:]...)
			break
		}
	}
	if len(b.streams[userID]) == 0 {
		delete(b.streams, userID)
	}
}

// SendToUser delivers msg to every live connection for userID. A full
// channel (a slow/stuck client) is skipped rather than blocking the
// pubsub handler.
func (b *Broadcaster) SendToUser(userID int64, msg Message) {
	b.mu.Lock()
	streams := append([]chan Message(nil), b.streams[userID]...)
	b.mu.Unlock()

	for _, ch := range streams {
		select {
		case ch <- msg:
		default:
		}
	}
}
