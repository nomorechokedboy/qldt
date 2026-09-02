// Package transferrequests exposes the transfer-requests approval workflow,
// mirroring apps/api/transfer-requests. Business logic lives in service.go
// (ported from controller.ts); this file is the API/DTO layer (ported from
// transfer-requests.ts), including its hand-written response types — same
// reason as the rest of this app: response types must be named structs, and
// keeping the wire shape independent of the persistence entities keeps
// relation fields (e.g. users.password) from ever leaking by accident.
package transferrequests

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"encore.app/authn"
	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/classes"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/logger"
	"encore.app/internal/materialassetevents"
	"encore.app/internal/materialassets"
	"encore.app/internal/materialstocks"
	"encore.app/internal/materialtypes"
	"encore.app/internal/rooms"
	"encore.app/internal/students"
	"encore.app/internal/transferrequests"
	"encore.app/internal/units"
	"encore.app/internal/users"
	encoreruntime "encore.dev"
	"encore.dev/beta/auth"
)

var svc *service

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("transferrequests: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("transferrequests: run migrations: %w", err))
	}

	svc = &service{
		repo:               transferrequests.NewRepository(conn),
		unitRepo:           units.NewRepository(conn),
		studentRepo:        students.NewRepository(conn),
		classRepo:          classes.NewRepository(conn),
		materialAssetRepo:  materialassets.NewRepository(conn),
		materialStockRepo:  materialstocks.NewRepository(conn),
		materialTypeRepo:   materialtypes.NewRepository(conn),
		materialAssetEvent: materialassetevents.NewRepository(conn),
		userRepo:           users.NewRepository(conn),
		roomRepo:           rooms.NewRepository(conn),
	}
}

func requireActorUserID(ctx context.Context) (int64, error) {
	authData, ok := auth.Data().(*authn.AuthData)
	if !ok || authData == nil {
		return 0, apperr.Unauthenticated("Authentication required")
	}
	return authData.UserID, nil
}

type UserSummary struct {
	ID          int64  `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
}

type UnitSummary struct {
	ID    int64  `json:"id"`
	Alias string `json:"alias"`
	Name  string `json:"name"`
	Level string `json:"level"`
}

type RoomSummary struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type StudentSummary struct {
	ID       int64  `json:"id"`
	FullName string `json:"fullName"`
	UnitID   *int64 `json:"unitId"`
}

type MaterialAssetSummary struct {
	ID             int64  `json:"id"`
	SerialNumber   string `json:"serialNumber"`
	MaterialTypeID int64  `json:"materialTypeId"`
	UnitID         int64  `json:"unitId"`
	RoomID         *int64 `json:"roomId"`
	Condition      string `json:"condition"`
	Status         string `json:"status"`
}

type MaterialTypeSummary struct {
	ID            int64   `json:"id"`
	Name          string  `json:"name"`
	UnitOfMeasure *string `json:"unitOfMeasure"`
}

type TransferRequestTrooperItemResp struct {
	ID            int64           `json:"id"`
	ItemStatus    string          `json:"itemStatus"`
	FailureReason *string         `json:"failureReason"`
	Student       *StudentSummary `json:"student,omitempty"`
}

type TransferRequestMaterialAssetItemResp struct {
	ID            int64                 `json:"id"`
	ItemStatus    string                `json:"itemStatus"`
	FailureReason *string               `json:"failureReason"`
	MaterialAsset *MaterialAssetSummary `json:"materialAsset,omitempty"`
}

type TransferRequestMaterialStockItemResp struct {
	ID            int64                `json:"id"`
	Condition     string               `json:"condition"`
	Quantity      int64                `json:"quantity"`
	ItemStatus    string               `json:"itemStatus"`
	FailureReason *string              `json:"failureReason"`
	MaterialType  *MaterialTypeSummary `json:"materialType,omitempty"`
}

type TransferRequestResp struct {
	ID              int64   `json:"id"`
	Status          string  `json:"status"`
	RejectionReason *string `json:"rejectionReason"`
	DecidedAt       *string `json:"decidedAt"`
	CreatedAt       string  `json:"createdAt"`
	UpdatedAt       string  `json:"updatedAt"`

	SourceUnit      *UnitSummary `json:"sourceUnit,omitempty"`
	DestinationUnit *UnitSummary `json:"destinationUnit,omitempty"`
	DestinationRoom *RoomSummary `json:"destinationRoom"`
	RequestedBy     *UserSummary `json:"requestedBy,omitempty"`
	Approver        *UserSummary `json:"approver,omitempty"`
	DecidedBy       *UserSummary `json:"decidedBy"`

	Troopers           []TransferRequestTrooperItemResp       `json:"troopers,omitempty"`
	MaterialAssetItems []TransferRequestMaterialAssetItemResp `json:"materialAssetItems,omitempty"`
	MaterialStockItems []TransferRequestMaterialStockItemResp `json:"materialStockItems,omitempty"`

	CanDecide bool `json:"canDecide"`
}

func toUserSummary(u *entities.User) *UserSummary {
	if u == nil {
		return nil
	}
	return &UserSummary{ID: u.ID, Username: u.Username, DisplayName: u.DisplayName}
}

func toUnitSummary(u *entities.Unit) *UnitSummary {
	if u == nil {
		return nil
	}
	return &UnitSummary{ID: u.ID, Alias: u.Alias, Name: u.Name, Level: string(u.Level)}
}

func toRoomSummary(r *entities.Room) *RoomSummary {
	if r == nil {
		return nil
	}
	return &RoomSummary{ID: r.ID, Name: r.Name}
}

func toStudentSummary(s *entities.Student) *StudentSummary {
	if s == nil {
		return nil
	}
	return &StudentSummary{ID: s.ID, FullName: s.FullName, UnitID: s.UnitID}
}

func toMaterialAssetSummary(a *entities.MaterialAsset) *MaterialAssetSummary {
	if a == nil {
		return nil
	}
	return &MaterialAssetSummary{
		ID:             a.ID,
		SerialNumber:   a.SerialNumber,
		MaterialTypeID: a.MaterialTypeID,
		UnitID:         a.UnitID,
		RoomID:         a.RoomID,
		Condition:      string(a.Condition),
		Status:         string(a.Status),
	}
}

func toMaterialTypeSummary(m *entities.MaterialType) *MaterialTypeSummary {
	if m == nil {
		return nil
	}
	return &MaterialTypeSummary{ID: m.ID, Name: m.Name, UnitOfMeasure: m.UnitOfMeasure}
}

func toResponse(d *Detail) TransferRequestResp {
	troopers := make([]TransferRequestTrooperItemResp, len(d.Troopers))
	for i, t := range d.Troopers {
		troopers[i] = TransferRequestTrooperItemResp{
			ID:            t.ID,
			ItemStatus:    string(t.ItemStatus),
			FailureReason: t.FailureReason,
			Student:       toStudentSummary(t.Student),
		}
	}

	materialAssetItems := make([]TransferRequestMaterialAssetItemResp, len(d.MaterialAssetItems))
	for i, m := range d.MaterialAssetItems {
		materialAssetItems[i] = TransferRequestMaterialAssetItemResp{
			ID:            m.ID,
			ItemStatus:    string(m.ItemStatus),
			FailureReason: m.FailureReason,
			MaterialAsset: toMaterialAssetSummary(m.MaterialAsset),
		}
	}

	materialStockItems := make([]TransferRequestMaterialStockItemResp, len(d.MaterialStockItems))
	for i, m := range d.MaterialStockItems {
		materialStockItems[i] = TransferRequestMaterialStockItemResp{
			ID:            m.ID,
			Condition:     string(m.Condition),
			Quantity:      m.Quantity,
			ItemStatus:    string(m.ItemStatus),
			FailureReason: m.FailureReason,
			MaterialType:  toMaterialTypeSummary(m.MaterialType),
		}
	}

	return TransferRequestResp{
		ID:                 d.ID,
		Status:             string(d.Status),
		RejectionReason:    d.RejectionReason,
		DecidedAt:          d.DecidedAt,
		CreatedAt:          d.CreatedAt,
		UpdatedAt:          d.UpdatedAt,
		SourceUnit:         toUnitSummary(d.SourceUnit),
		DestinationUnit:    toUnitSummary(d.DestinationUnit),
		DestinationRoom:    toRoomSummary(d.DestinationRoom),
		RequestedBy:        toUserSummary(d.RequestedBy),
		Approver:           toUserSummary(d.Approver),
		DecidedBy:          toUserSummary(d.DecidedBy),
		Troopers:           troopers,
		MaterialAssetItems: materialAssetItems,
		MaterialStockItems: materialStockItems,
	}
}

// toResponseWithDetail loads a transfer request's full detail and maps it
// to the wire response, including canDecide for actorUserID.
func toResponseWithDetail(ctx context.Context, tr *entities.TransferRequest, actorUserID int64) (TransferRequestResp, error) {
	detail, err := svc.LoadDetail(ctx, tr)
	if err != nil {
		return TransferRequestResp{}, err
	}
	resp := toResponse(detail)

	if tr.Status == entities.TransferRequestStatusPending {
		canDecide, err := svc.CanDecide(ctx, tr.SourceUnitID, tr.DestinationUnitID, actorUserID)
		if err != nil {
			return TransferRequestResp{}, err
		}
		resp.CanDecide = canDecide
	}

	return resp, nil
}

func toResponsesWithDetail(ctx context.Context, trs []*entities.TransferRequest, actorUserID int64) ([]TransferRequestResp, error) {
	out := make([]TransferRequestResp, len(trs))
	for i, tr := range trs {
		resp, err := toResponseWithDetail(ctx, tr, actorUserID)
		if err != nil {
			return nil, err
		}
		out[i] = resp
	}
	return out, nil
}

type CreateTransferRequestBody struct {
	SourceUnitID      int64                                       `json:"sourceUnitId"`
	DestinationUnitID int64                                       `json:"destinationUnitId"`
	DestinationRoomID *int64                                      `json:"destinationRoomId,omitempty"`
	ApproverUserID    int64                                       `json:"approverUserId"`
	Troopers          []transferrequests.CreateTrooperInput       `json:"troopers,omitempty"`
	MaterialAssets    []transferrequests.CreateMaterialAssetInput `json:"materialAssets,omitempty"`
	MaterialStocks    []transferrequests.CreateMaterialStockInput `json:"materialStocks,omitempty"`
}

type CreateTransferRequestResponse struct {
	Data TransferRequestResp `json:"data"`
}

//encore:api auth method=POST path=/transfer-requests tag:audited
func CreateTransferRequest(ctx context.Context, req *CreateTransferRequestBody) (*CreateTransferRequestResponse, error) {
	actorUserID, err := requireActorUserID(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	created, err := svc.Create(ctx, CreateInput{
		SourceUnitID:      req.SourceUnitID,
		DestinationUnitID: req.DestinationUnitID,
		DestinationRoomID: req.DestinationRoomID,
		ApproverUserID:    req.ApproverUserID,
		Troopers:          req.Troopers,
		MaterialAssets:    req.MaterialAssets,
		MaterialStocks:    req.MaterialStocks,
	}, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	resp, err := toResponseWithDetail(ctx, created, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	auditctx.SetContext(ctx, []any{created.ID}, nil, resp)

	return &CreateTransferRequestResponse{Data: resp}, nil
}

type GetTransferRequestsRequest struct {
	Status string `query:"status"`
}

type GetTransferRequestsResponse struct {
	Data []TransferRequestResp `json:"data"`
}

//encore:api auth method=GET path=/transfer-requests
func GetTransferRequests(ctx context.Context, req *GetTransferRequestsRequest) (*GetTransferRequestsResponse, error) {
	actorUserID, err := requireActorUserID(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	rows, err := svc.Find(ctx, transferrequests.Query{Status: entities.TransferRequestStatus(req.Status)})
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data, err := toResponsesWithDetail(ctx, rows, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &GetTransferRequestsResponse{Data: data}, nil
}

type GetTransferDestinationUnitsResponse struct {
	Data []UnitSummary `json:"data"`
}

// Deliberately NOT nested under /transfer-requests/ (unlike
// transfer-requests.ts's GetTransferDestinationUnits): any second path
// segment there — literal or not — collides with GetTransferRequest's
// ":id" wildcard occupying that same position. encore run's app-graph
// builder (error E1094) rejects that regardless of total path length (it
// still rejected /transfer-requests/query/destination-units, a 3-segment
// path, against the 2-segment /transfer-requests/:id), so the only fix is
// a route that shares no path segment with /transfer-requests/:id at all.
// GetTransferEligibleApprovers below has the same issue and the same fix.
//
//encore:api auth method=GET path=/transfer-request-destination-units
func GetTransferDestinationUnits(ctx context.Context) (*GetTransferDestinationUnitsResponse, error) {
	units, err := svc.ListDestinationCandidateUnits(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data := make([]UnitSummary, len(units))
	for i, u := range units {
		data[i] = UnitSummary{ID: u.ID, Alias: u.Alias, Name: u.Name, Level: string(u.Level)}
	}

	return &GetTransferDestinationUnitsResponse{Data: data}, nil
}

type GetTransferEligibleApproversRequest struct {
	SourceUnitID      int64 `query:"sourceUnitId"`
	DestinationUnitID int64 `query:"destinationUnitId"`
}

type GetTransferEligibleApproversResponse struct {
	Data []UserSummary `json:"data"`
}

//encore:api auth method=GET path=/transfer-request-eligible-approvers
func GetTransferEligibleApprovers(ctx context.Context, req *GetTransferEligibleApproversRequest) (*GetTransferEligibleApproversResponse, error) {
	rows, err := svc.ListEligibleApprovers(ctx, req.SourceUnitID, req.DestinationUnitID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data := make([]UserSummary, len(rows))
	for i, u := range rows {
		data[i] = UserSummary{ID: u.ID, Username: u.Username, DisplayName: u.DisplayName}
	}

	return &GetTransferEligibleApproversResponse{Data: data}, nil
}

type GetTransferRequestResponse struct {
	Data TransferRequestResp `json:"data"`
}

//encore:api auth method=GET path=/transfer-requests/:id
func GetTransferRequest(ctx context.Context, id int64) (*GetTransferRequestResponse, error) {
	actorUserID, err := requireActorUserID(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	tr, err := svc.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	resp, err := toResponseWithDetail(ctx, tr, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &GetTransferRequestResponse{Data: resp}, nil
}

type ApproveTransferRequestResponse struct {
	Data TransferRequestResp `json:"data"`
}

//encore:api auth method=POST path=/transfer-requests/:id/approve tag:audited
func ApproveTransferRequest(ctx context.Context, id int64) (*ApproveTransferRequestResponse, error) {
	actorUserID, err := requireActorUserID(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	before, err := svc.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(err)
	}
	beforeResp, err := toResponseWithDetail(ctx, before, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data, err := svc.Approve(ctx, id, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	resp, err := toResponseWithDetail(ctx, data, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	auditctx.SetContext(ctx, []any{id}, beforeResp, resp)

	return &ApproveTransferRequestResponse{Data: resp}, nil
}

type RejectTransferRequestRequest struct {
	Reason string `json:"reason"`
}

type RejectTransferRequestResponse struct {
	Data TransferRequestResp `json:"data"`
}

//encore:api auth method=POST path=/transfer-requests/:id/reject tag:audited
func RejectTransferRequest(ctx context.Context, id int64, req *RejectTransferRequestRequest) (*RejectTransferRequestResponse, error) {
	actorUserID, err := requireActorUserID(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}
	if req.Reason == "" {
		return nil, apperr.Wrap(apperr.InvalidArgument("A rejection reason is required"))
	}

	before, err := svc.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(err)
	}
	beforeResp, err := toResponseWithDetail(ctx, before, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data, err := svc.Reject(ctx, id, actorUserID, req.Reason)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	resp, err := toResponseWithDetail(ctx, data, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	auditctx.SetContext(ctx, []any{id}, beforeResp, resp)

	return &RejectTransferRequestResponse{Data: resp}, nil
}

type CancelTransferRequestResponse struct {
	Data TransferRequestResp `json:"data"`
}

//encore:api auth method=POST path=/transfer-requests/:id/cancel tag:audited
func CancelTransferRequest(ctx context.Context, id int64) (*CancelTransferRequestResponse, error) {
	actorUserID, err := requireActorUserID(ctx)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	before, err := svc.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(err)
	}
	beforeResp, err := toResponseWithDetail(ctx, before, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	data, err := svc.Cancel(ctx, id, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	resp, err := toResponseWithDetail(ctx, data, actorUserID)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	auditctx.SetContext(ctx, []any{id}, beforeResp, resp)

	return &CancelTransferRequestResponse{Data: resp}, nil
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// ExportTransferRequestHandover mirrors transfer-requests.ts's
// ExportTransferRequestHandover raw endpoint: it builds and returns a
// filled handover-report .docx for an approved transfer request.
//
//encore:api auth raw method=GET path=/transfer-requests/:id/export-handover
func ExportTransferRequestHandover(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	idStr := encoreruntime.CurrentRequest().PathParams.Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid transfer request id")
		return
	}

	city := req.URL.Query().Get("city")

	buf, err := svc.BuildHandoverReport(ctx, id, city)
	if err != nil {
		logger.ErrorContext(ctx, "ExportTransferRequestHandover error", "err", err)
		if errors.Is(err, apperr.ErrInvalidArgument) {
			writeJSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "Internal error for exporting file")
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="bien-ban-ban-giao-%d.docx"`, id))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(buf)
}
