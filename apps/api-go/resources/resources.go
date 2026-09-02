// Package resources exposes bare CRUD endpoints over the resources table
// (the RBAC "what can be acted on" lookup table — e.g. "classes",
// "students"). Same scope decisions as the students package.
package resources

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/resources"
)

var repo *resources.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("resources: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("resources: run migrations: %w", err))
	}

	repo = resources.NewRepository(conn)
}

type CreateResourcesRequest struct {
	Data []CreateResourceInput `json:"data"`
}

type ResourcesResponse struct {
	Data []*entities.Resource `json:"data"`
}

//encore:api auth method=POST path=/resources
func CreateResources(ctx context.Context, req *CreateResourcesRequest) (*ResourcesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one resource"))
	}

	rows := make([]*entities.Resource, len(req.Data))
	for i, in := range req.Data {
		rows[i] = in.toEntity()
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	return &ResourcesResponse{Data: rows}, nil
}

type GetResourcesRequest struct {
	Ids []int64 `query:"ids"`
}

//encore:api auth method=GET path=/resources
func GetResources(ctx context.Context, req *GetResourcesRequest) (*ResourcesResponse, error) {
	rows, err := repo.Find(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &ResourcesResponse{Data: rows}, nil
}

type GetResourceResponse struct {
	Data *entities.Resource `json:"data"`
}

//encore:api auth method=GET path=/resources/:id
func GetResource(ctx context.Context, id int64) (*GetResourceResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("resource %d not found", id))
	}

	return &GetResourceResponse{Data: row}, nil
}

type UpdateResourceInput struct {
	ID   int64           `json:"id"`
	Data json.RawMessage `json:"data"`
}

type UpdateResourcesRequest struct {
	Data []UpdateResourceInput `json:"data"`
}

//encore:api auth method=PATCH path=/resources
func UpdateResources(ctx context.Context, req *UpdateResourcesRequest) (*ResourcesResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Resource, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for resource id %d: %v", u.ID, err))
		}

		cols := toUpdateParams(data)
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for resource id %d", u.ID))
		}

		row, err := repo.Update(ctx, u.ID, cols)
		if err != nil {
			return nil, apperr.Wrap(err)
		}
		rows[i] = row
	}

	return &ResourcesResponse{Data: rows}, nil
}

type DeleteResourcesRequest struct {
	Ids []int64 `query:"ids"`
}

type DeleteResourcesResponse struct {
	Ids []int64 `json:"ids"`
}

//encore:api auth method=DELETE path=/resources
func DeleteResources(ctx context.Context, req *DeleteResourcesRequest) (*DeleteResourcesResponse, error) {
	if len(req.Ids) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("ids must contain at least one id"))
	}

	if _, err := repo.Delete(ctx, req.Ids); err != nil {
		return nil, apperr.Wrap(err)
	}

	return &DeleteResourcesResponse{Ids: req.Ids}, nil
}
