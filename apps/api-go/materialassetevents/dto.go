package materialassetevents

import (
	"encoding/json"

	"encore.app/internal/entities"
)

type CreateMaterialAssetEventInput struct {
	AssetID       int64           `json:"assetId"`
	EventType     string          `json:"eventType"`
	PreviousValue json.RawMessage `json:"previousValue,omitempty"`
	NewValue      json.RawMessage `json:"newValue,omitempty"`
	Note          *string         `json:"note,omitempty"`
	ActorUserID   *int64          `json:"actorUserId,omitempty"`
}

func rawOrDefault(raw json.RawMessage, def string) entities.JSONText {
	if len(raw) == 0 {
		return entities.JSONText(def)
	}
	return entities.JSONText(raw)
}

func (in CreateMaterialAssetEventInput) toEntity() *entities.MaterialAssetEvent {
	return &entities.MaterialAssetEvent{
		AssetID:       in.AssetID,
		EventType:     entities.MaterialAssetEventType(in.EventType),
		PreviousValue: rawOrDefault(in.PreviousValue, "{}"),
		NewValue:      rawOrDefault(in.NewValue, "{}"),
		Note:          in.Note,
		ActorUserID:   in.ActorUserID,
	}
}
