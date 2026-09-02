package entities

// MaterialAssetEventType mirrors apps/api/schema/material-asset-events.ts's
// MaterialAssetEventType.
type MaterialAssetEventType string

const (
	MaterialAssetEventAssigned         MaterialAssetEventType = "assigned"
	MaterialAssetEventUnassigned       MaterialAssetEventType = "unassigned"
	MaterialAssetEventConditionChanged MaterialAssetEventType = "condition_changed"
	MaterialAssetEventStatusChanged    MaterialAssetEventType = "status_changed"
	MaterialAssetEventTransferred      MaterialAssetEventType = "transferred"
)

func (t MaterialAssetEventType) Valid() bool {
	switch t {
	case MaterialAssetEventAssigned, MaterialAssetEventUnassigned, MaterialAssetEventConditionChanged,
		MaterialAssetEventStatusChanged, MaterialAssetEventTransferred:
		return true
	default:
		return false
	}
}

// MaterialAssetEvent mirrors apps/api/schema/material-asset-events.ts's
// material_asset_events table.
type MaterialAssetEvent struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	AssetID       int64                  `db:"assetId" json:"assetId"`
	EventType     MaterialAssetEventType `db:"eventType" json:"eventType"`
	PreviousValue JSONText               `db:"previousValue" json:"previousValue"`
	NewValue      JSONText               `db:"newValue" json:"newValue"`
	Note          *string                `db:"note" json:"note"`
	ActorUserID   *int64                 `db:"actorUserId" json:"actorUserId"`
}

func (MaterialAssetEvent) TableName() string { return "material_asset_events" }
