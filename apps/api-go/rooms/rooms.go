// Package rooms exposes bare CRUD endpoints over the rooms table. Same
// scope decisions as the students package.
package rooms

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/rooms"
)

var repo *rooms.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("rooms: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("rooms: run migrations: %w", err))
	}

	repo = rooms.NewRepository(conn)
}

type CreateRoomsRequest struct {
	Data []CreateRoomInput `json:"data"`
}

type RoomsResponse struct {
	Data []*entities.Room `json:"data"`
}

//encore:api auth method=POST path=/rooms tag:audited
func CreateRooms(ctx context.Context, req *CreateRoomsRequest) (*RoomsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one room"))
	}

	rows := make([]*entities.Room, len(req.Data))
	for i, in := range req.Data {
		if in.UnitID == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("unitId is required"))
		}
		rows[i] = in.toEntity()
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &RoomsResponse{Data: rows}, nil
}

type GetRoomsRequest struct {
	Ids        []int64 `query:"ids"`
	UnitIds    []int64 `query:"unitIds"`
	BuildingID int64   `query:"buildingId"`
}

//encore:api auth method=GET path=/rooms
func GetRooms(ctx context.Context, req *GetRoomsRequest) (*RoomsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids, req.UnitIds, req.BuildingID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &RoomsResponse{Data: rows}, nil
}

type GetRoomResponse struct {
	Data *entities.Room `json:"data"`
}

//encore:api auth method=GET path=/rooms/:id
func GetRoom(ctx context.Context, id int64) (*GetRoomResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("room %d not found", id))
	}

	return &GetRoomResponse{Data: row}, nil
}

type UpdateRoomInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateRoomsRequest struct {
	Data []UpdateRoomInput `json:"data"`
}

//encore:api auth method=PATCH path=/rooms tag:audited
func UpdateRooms(ctx context.Context, req *UpdateRoomsRequest) (*RoomsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Room, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for room id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for room id %d", u.ID))
		}

		row, err := repo.Update(ctx, u.ID, cols)
		if err != nil {
			return nil, apperr.Wrap(err)
		}
		rows[i] = row
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &RoomsResponse{Data: rows}, nil
}

type DeleteRoomsRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteRoomsResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/rooms tag:audited
func DeleteRooms(ctx context.Context, req *DeleteRoomsRequest) (*DeleteRoomsResponse, error) {
	if len(req.Ids) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("ids must contain at least one id"))
	}

	deleted, err := repo.Delete(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(req.Ids))
	for i, id := range req.Ids {
		ids[i] = id
	}
	auditctx.SetContext(ctx, ids, deleted, nil)

	return &DeleteRoomsResponse{Ids: req.Ids}, nil
}
