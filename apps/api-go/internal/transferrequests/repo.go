// Package transferrequests is the persistence layer for the
// transfer_requests table and its three per-resource-type item tables,
// mirroring apps/api/transfer-requests/repo.ts. Unlike Drizzle's relational
// query builder, dbx has no eager-loading of relations, so this repo only
// returns flat rows — the transferrequests service package composes the
// full "with details" view by calling the other resource repos directly by
// id, the same way apps/api's controller.ts already does for anything not
// covered by WITH_DETAILS (e.g. re-fetching a student at approval time).
package transferrequests

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

type CreateTrooperInput struct {
	StudentID int64
}

type CreateMaterialAssetInput struct {
	MaterialAssetID int64
}

type CreateMaterialStockInput struct {
	MaterialTypeID int64
	Condition      entities.MaterialCondition
	Quantity       int64
}

// Create inserts the transfer_requests header row plus any item rows in a
// single transaction, mirroring repo.ts's create().
func (r *Repository) Create(
	ctx context.Context,
	header *entities.TransferRequest,
	troopers []CreateTrooperInput,
	materialAssets []CreateMaterialAssetInput,
	materialStocks []CreateMaterialStockInput,
) (*entities.TransferRequest, error) {
	err := r.db.TransactionalContext(ctx, nil, func(tx *dbx.Tx) error {
		if err := tx.Model(header).Insert(); err != nil {
			return err
		}

		for _, t := range troopers {
			row := &entities.TransferRequestTrooper{
				TransferRequestID: header.ID,
				StudentID:         t.StudentID,
				ItemStatus:        entities.TransferRequestItemStatusPending,
			}
			if err := tx.Model(row).Insert(); err != nil {
				return err
			}
		}

		for _, m := range materialAssets {
			row := &entities.TransferRequestMaterialAsset{
				TransferRequestID: header.ID,
				MaterialAssetID:   m.MaterialAssetID,
				ItemStatus:        entities.TransferRequestItemStatusPending,
			}
			if err := tx.Model(row).Insert(); err != nil {
				return err
			}
		}

		for _, m := range materialStocks {
			row := &entities.TransferRequestMaterialStock{
				TransferRequestID: header.ID,
				MaterialTypeID:    m.MaterialTypeID,
				Condition:         m.Condition,
				Quantity:          m.Quantity,
				ItemStatus:        entities.TransferRequestItemStatusPending,
			}
			if err := tx.Model(row).Insert(); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("transfer_requests: create: %w", err)
	}

	return header, nil
}

// Query narrows Find; zero/empty values mean "no filter" for that field.
type Query struct {
	UnitIds           []int64
	Status            entities.TransferRequestStatus
	RequestedByUserID int64
	ApproverUserID    int64
	Ids               []int64
}

func (r *Repository) Find(ctx context.Context, q Query) ([]*entities.TransferRequest, error) {
	var conds []dbx.Expression
	if len(q.UnitIds) > 0 {
		conds = append(conds, dbx.In("sourceUnitId", toInterfaceSlice(q.UnitIds)...))
	}
	if q.Status != "" {
		conds = append(conds, dbx.HashExp{"status": q.Status})
	}
	if q.RequestedByUserID != 0 {
		conds = append(conds, dbx.HashExp{"requestedByUserId": q.RequestedByUserID})
	}
	if q.ApproverUserID != 0 {
		conds = append(conds, dbx.HashExp{"approverUserId": q.ApproverUserID})
	}
	if len(q.Ids) > 0 {
		conds = append(conds, dbx.In("id", toInterfaceSlice(q.Ids)...))
	}

	query := r.db.WithContext(ctx).Select("*").From("transfer_requests").OrderBy("createdAt DESC")
	if len(conds) > 0 {
		query = query.Where(dbx.And(conds...))
	}

	var rows []*entities.TransferRequest
	if err := query.All(&rows); err != nil {
		return nil, fmt.Errorf("transfer_requests: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.TransferRequest, error) {
	var row entities.TransferRequest
	err := r.db.WithContext(ctx).
		Select("*").
		From("transfer_requests").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("transfer_requests: find one: %w", err)
	}
	return &row, nil
}

func (r *Repository) FindTroopers(ctx context.Context, transferRequestID int64) ([]*entities.TransferRequestTrooper, error) {
	var rows []*entities.TransferRequestTrooper
	err := r.db.WithContext(ctx).Select("*").From("transfer_request_troopers").
		Where(dbx.HashExp{"transferRequestId": transferRequestID}).
		OrderBy("id").
		All(&rows)
	if err != nil {
		return nil, fmt.Errorf("transfer_requests: find troopers: %w", err)
	}
	return rows, nil
}

func (r *Repository) FindMaterialAssetItems(ctx context.Context, transferRequestID int64) ([]*entities.TransferRequestMaterialAsset, error) {
	var rows []*entities.TransferRequestMaterialAsset
	err := r.db.WithContext(ctx).Select("*").From("transfer_request_material_assets").
		Where(dbx.HashExp{"transferRequestId": transferRequestID}).
		OrderBy("id").
		All(&rows)
	if err != nil {
		return nil, fmt.Errorf("transfer_requests: find material asset items: %w", err)
	}
	return rows, nil
}

func (r *Repository) FindMaterialStockItems(ctx context.Context, transferRequestID int64) ([]*entities.TransferRequestMaterialStock, error) {
	var rows []*entities.TransferRequestMaterialStock
	err := r.db.WithContext(ctx).Select("*").From("transfer_request_material_stocks").
		Where(dbx.HashExp{"transferRequestId": transferRequestID}).
		OrderBy("id").
		All(&rows)
	if err != nil {
		return nil, fmt.Errorf("transfer_requests: find material stock items: %w", err)
	}
	return rows, nil
}

// UpdateParam is one row's partial update, mirroring repo.ts's
// UpdateTransferRequestMap entry.
type UpdateParam struct {
	ID   int64
	Cols dbx.Params
}

// Update applies each partial update in a single transaction and returns
// the affected rows as they stand afterward, mirroring repo.ts's update().
func (r *Repository) Update(ctx context.Context, params []UpdateParam) ([]*entities.TransferRequest, error) {
	updated := make([]*entities.TransferRequest, 0, len(params))
	err := r.db.TransactionalContext(ctx, nil, func(tx *dbx.Tx) error {
		for _, p := range params {
			if len(p.Cols) == 0 {
				continue
			}
			if _, err := tx.Update("transfer_requests", p.Cols, dbx.HashExp{"id": p.ID}).Execute(); err != nil {
				return err
			}
			var row entities.TransferRequest
			if err := tx.Select("*").From("transfer_requests").Where(dbx.HashExp{"id": p.ID}).One(&row); err != nil {
				return err
			}
			updated = append(updated, &row)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("transfer_requests: update: %w", err)
	}
	return updated, nil
}

func (r *Repository) SetTrooperItemStatus(ctx context.Context, id int64, status entities.TransferRequestItemStatus, failureReason *string) error {
	cols := dbx.Params{"itemStatus": status, "failureReason": failureReasonValue(failureReason)}
	if _, err := r.db.WithContext(ctx).Update("transfer_request_troopers", cols, dbx.HashExp{"id": id}).Execute(); err != nil {
		return fmt.Errorf("transfer_requests: set trooper item status: %w", err)
	}
	return nil
}

func (r *Repository) SetMaterialAssetItemStatus(ctx context.Context, id int64, status entities.TransferRequestItemStatus, failureReason *string) error {
	cols := dbx.Params{"itemStatus": status, "failureReason": failureReasonValue(failureReason)}
	if _, err := r.db.WithContext(ctx).Update("transfer_request_material_assets", cols, dbx.HashExp{"id": id}).Execute(); err != nil {
		return fmt.Errorf("transfer_requests: set material asset item status: %w", err)
	}
	return nil
}

func (r *Repository) SetMaterialStockItemStatus(ctx context.Context, id int64, status entities.TransferRequestItemStatus, failureReason *string) error {
	cols := dbx.Params{"itemStatus": status, "failureReason": failureReasonValue(failureReason)}
	if _, err := r.db.WithContext(ctx).Update("transfer_request_material_stocks", cols, dbx.HashExp{"id": id}).Execute(); err != nil {
		return fmt.Errorf("transfer_requests: set material stock item status: %w", err)
	}
	return nil
}

func failureReasonValue(reason *string) any {
	if reason == nil {
		return nil
	}
	return *reason
}

func toInterfaceSlice[T any](in []T) []interface{} {
	out := make([]interface{}, len(in))
	for i, v := range in {
		out[i] = v
	}
	return out
}
