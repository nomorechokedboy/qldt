package entities

// AuditAction mirrors apps/api/schema/audit-logs.ts's AuditAction.
type AuditAction string

const (
	AuditActionCreate  AuditAction = "create"
	AuditActionUpdate  AuditAction = "update"
	AuditActionDelete  AuditAction = "delete"
	AuditActionApprove AuditAction = "approve"
	AuditActionReject  AuditAction = "reject"
)

func (a AuditAction) Valid() bool {
	switch a {
	case AuditActionCreate, AuditActionUpdate, AuditActionDelete, AuditActionApprove, AuditActionReject:
		return true
	default:
		return false
	}
}

// AuditLog mirrors apps/api/schema/audit-logs.ts's audit_logs table. Rows
// are only ever written by the audit-log pubsub subscriber (see
// internal/auditlogs and middleware/audit.go) — never directly by API
// handlers — so, like material_asset_events, there is no Update/Delete on
// its repo.
type AuditLog struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	ActorUserID   *int64      `db:"actorUserId" json:"actorUserId"`
	Resource      string      `db:"resource" json:"resource"`
	Action        AuditAction `db:"action" json:"action"`
	ResourceIds   JSONText    `db:"resourceIds" json:"resourceIds"`
	Method        string      `db:"method" json:"method"`
	Path          string      `db:"path" json:"path"`
	StatusCode    *int        `db:"statusCode" json:"statusCode"`
	PreviousValue JSONText    `db:"previousValue" json:"previousValue"`
	NewValue      JSONText    `db:"newValue" json:"newValue"`
}

func (AuditLog) TableName() string { return "audit_logs" }
