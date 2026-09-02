package transferrequests

import (
	"context"
	"encoding/json"
	"time"

	"encore.app/internal/apperr"
	"encore.app/internal/classes"
	"encore.app/internal/entities"
	"encore.app/internal/materialassetevents"
	"encore.app/internal/materialassets"
	"encore.app/internal/materialstocks"
	"encore.app/internal/materialtypes"
	"encore.app/internal/rooms"
	"encore.app/internal/students"
	"encore.app/internal/transferrequests"
	"encore.app/internal/units"
	"encore.app/internal/users"
	"github.com/pocketbase/dbx"
)

// service holds the business logic ported from
// apps/api/transfer-requests/controller.ts, wired up over the bare
// persistence repos of the resource types a transfer request can move.
type service struct {
	repo               *transferrequests.Repository
	unitRepo           *units.Repository
	studentRepo        *students.Repository
	classRepo          *classes.Repository
	materialAssetRepo  *materialassets.Repository
	materialStockRepo  *materialstocks.Repository
	materialTypeRepo   *materialtypes.Repository
	materialAssetEvent *materialassetevents.Repository
	userRepo           *users.Repository
	roomRepo           *rooms.Repository
}

// commanderIDsOf mirrors controller.ts's commanderIdsOf.
func commanderIDsOf(u *entities.Unit) []int64 {
	ids := make([]int64, 0, 4)
	for _, id := range []*int64{u.CommanderID, u.DeputyCommanderID, u.PoliticalCommanderID, u.DeputyPoliticalCommanderID} {
		if id != nil {
			ids = append(ids, *id)
		}
	}
	return ids
}

// commonAncestorUnits mirrors controller.ts's commonAncestorUnits: units at
// or above both the source and destination units in the hierarchy.
func (s *service) commonAncestorUnits(ctx context.Context, sourceUnitID, destinationUnitID int64) ([]*entities.Unit, error) {
	sourceChain, err := s.unitRepo.FindAncestorChain(ctx, sourceUnitID)
	if err != nil {
		return nil, err
	}
	destChain, err := s.unitRepo.FindAncestorChain(ctx, destinationUnitID)
	if err != nil {
		return nil, err
	}

	destIDs := make(map[int64]bool, len(destChain))
	for _, u := range destChain {
		destIDs[u.ID] = true
	}

	var common []*entities.Unit
	for _, u := range sourceChain {
		if destIDs[u.ID] {
			common = append(common, u)
		}
	}
	return common, nil
}

func idSet(ids []int64) map[int64]bool {
	m := make(map[int64]bool, len(ids))
	for _, id := range ids {
		m[id] = true
	}
	return m
}

// eligibleApproverIDs mirrors controller.ts's eligibleApproverIds: throws
// when the source/destination pair has no common superior unit.
func (s *service) eligibleApproverIDs(ctx context.Context, sourceUnitID, destinationUnitID int64) (map[int64]bool, error) {
	commonUnits, err := s.commonAncestorUnits(ctx, sourceUnitID, destinationUnitID)
	if err != nil {
		return nil, err
	}
	if len(commonUnits) == 0 {
		return nil, apperr.InvalidArgument("Source and destination units have no common superior unit")
	}

	var ids []int64
	for _, u := range commonUnits {
		ids = append(ids, commanderIDsOf(u)...)
	}
	return idSet(ids), nil
}

// eligibleApproverIDsOrEmpty mirrors controller.ts's
// eligibleApproverIdsOrEmpty: never throws for a pair with no common
// superior unit — used for read-only UI hints.
func (s *service) eligibleApproverIDsOrEmpty(ctx context.Context, sourceUnitID, destinationUnitID int64) (map[int64]bool, error) {
	commonUnits, err := s.commonAncestorUnits(ctx, sourceUnitID, destinationUnitID)
	if err != nil {
		return nil, err
	}

	var ids []int64
	for _, u := range commonUnits {
		ids = append(ids, commanderIDsOf(u)...)
	}
	return idSet(ids), nil
}

// ListEligibleApprovers mirrors controller.ts's listEligibleApprovers.
func (s *service) ListEligibleApprovers(ctx context.Context, sourceUnitID, destinationUnitID int64) ([]*entities.User, error) {
	ids, err := s.eligibleApproverIDsOrEmpty(ctx, sourceUnitID, destinationUnitID)
	if err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return nil, nil
	}
	idList := make([]int64, 0, len(ids))
	for id := range ids {
		idList = append(idList, id)
	}
	return s.userRepo.Find(ctx, idList)
}

// CanDecide mirrors controller.ts's canDecide.
func (s *service) CanDecide(ctx context.Context, sourceUnitID, destinationUnitID, userID int64) (bool, error) {
	ids, err := s.eligibleApproverIDsOrEmpty(ctx, sourceUnitID, destinationUnitID)
	if err != nil {
		return false, err
	}
	return ids[userID], nil
}

// studentUnitID mirrors controller.ts's studentUnitId: a student is either
// attached directly to a unit, or reached only through their class.
func (s *service) studentUnitID(ctx context.Context, student *entities.Student) (*int64, error) {
	if student.UnitID != nil {
		return student.UnitID, nil
	}
	if student.ClassID == nil {
		return nil, nil
	}
	class, err := s.classRepo.FindOne(ctx, *student.ClassID)
	if err != nil {
		return nil, nil
	}
	return &class.UnitID, nil
}

func (s *service) unitAndDescendantIDs(ctx context.Context, unitID int64) ([]int64, error) {
	return s.unitRepo.FindDescendantUnitIds(ctx, unitID)
}

func (s *service) assertUnitIsCompanyOrAbove(ctx context.Context, unitID int64, label string) error {
	found, err := s.unitRepo.Find(ctx, []int64{unitID}, "")
	if err != nil {
		return err
	}
	if len(found) == 0 {
		return apperr.InvalidArgument("%s unit not found: %d", label, unitID)
	}
	if !found[0].Level.IsCompanyOrAbove() {
		return apperr.InvalidArgument("Transfer requests require %s unit to be Company level or larger. Got: %s", label, found[0].Level)
	}
	return nil
}

// ListDestinationCandidateUnits mirrors controller.ts's
// listDestinationCandidateUnits.
func (s *service) ListDestinationCandidateUnits(ctx context.Context) ([]*entities.Unit, error) {
	all, err := s.unitRepo.Find(ctx, nil, "")
	if err != nil {
		return nil, err
	}
	var out []*entities.Unit
	for _, u := range all {
		if u.Level.IsCompanyOrAbove() {
			out = append(out, u)
		}
	}
	return out, nil
}

func (s *service) getRequestOrThrow(ctx context.Context, id int64) (*entities.TransferRequest, error) {
	tr, err := s.repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.InvalidArgument("Transfer request not found: %d", id)
	}
	return tr, nil
}

// CreateInput mirrors schema/transfer-requests.ts's
// CreateTransferRequestInput.
type CreateInput struct {
	SourceUnitID      int64
	DestinationUnitID int64
	DestinationRoomID *int64
	ApproverUserID    int64
	Troopers          []transferrequests.CreateTrooperInput
	MaterialAssets    []transferrequests.CreateMaterialAssetInput
	MaterialStocks    []transferrequests.CreateMaterialStockInput
}

// Create mirrors controller.ts's create().
func (s *service) Create(ctx context.Context, input CreateInput, requestedByUserID int64) (*entities.TransferRequest, error) {
	if len(input.Troopers) == 0 && len(input.MaterialAssets) == 0 && len(input.MaterialStocks) == 0 {
		return nil, apperr.InvalidArgument("A transfer request must include at least one resource")
	}
	if input.SourceUnitID == input.DestinationUnitID {
		return nil, apperr.InvalidArgument("Source and destination units must be different")
	}

	if err := s.assertUnitIsCompanyOrAbove(ctx, input.SourceUnitID, "Source"); err != nil {
		return nil, err
	}
	if err := s.assertUnitIsCompanyOrAbove(ctx, input.DestinationUnitID, "Destination"); err != nil {
		return nil, err
	}

	sourceChain, err := s.unitRepo.FindAncestorChain(ctx, input.SourceUnitID)
	if err != nil {
		return nil, err
	}
	var requesterEligibleIDs []int64
	for _, u := range sourceChain {
		requesterEligibleIDs = append(requesterEligibleIDs, commanderIDsOf(u)...)
	}
	if !idSet(requesterEligibleIDs)[requestedByUserID] {
		return nil, apperr.PermissionDenied("You don't have permission to create a transfer request for this unit")
	}

	eligibleApproverIDs, err := s.eligibleApproverIDs(ctx, input.SourceUnitID, input.DestinationUnitID)
	if err != nil {
		return nil, err
	}
	if !eligibleApproverIDs[input.ApproverUserID] {
		return nil, apperr.InvalidArgument("Selected approver is not a commander/deputy commander/political commander/deputy political commander of any unit superior to both source and destination units")
	}

	sourceScopeUnitIDs, err := s.unitAndDescendantIDs(ctx, input.SourceUnitID)
	if err != nil {
		return nil, err
	}
	scopeSet := idSet(sourceScopeUnitIDs)

	for _, t := range input.Troopers {
		found, err := s.studentRepo.Find(ctx, []int64{t.StudentID})
		if err != nil {
			return nil, err
		}
		if len(found) == 0 {
			return nil, apperr.InvalidArgument("Trooper %d does not currently belong to the source unit or one of its subordinate units", t.StudentID)
		}
		studentUnitID, err := s.studentUnitID(ctx, found[0])
		if err != nil {
			return nil, err
		}
		if studentUnitID == nil || !scopeSet[*studentUnitID] {
			return nil, apperr.InvalidArgument("Trooper %d does not currently belong to the source unit or one of its subordinate units", t.StudentID)
		}
	}

	for _, m := range input.MaterialAssets {
		found, err := s.materialAssetRepo.Find(ctx, materialassets.Filter{Ids: []int64{m.MaterialAssetID}})
		if err != nil {
			return nil, err
		}
		if len(found) == 0 || !scopeSet[found[0].UnitID] {
			return nil, apperr.InvalidArgument("Material asset %d does not currently belong to the source unit or one of its subordinate units", m.MaterialAssetID)
		}
	}

	for _, m := range input.MaterialStocks {
		available, err := s.availableStockQuantity(ctx, sourceScopeUnitIDs, m.MaterialTypeID, m.Condition)
		if err != nil {
			return nil, err
		}
		if available < m.Quantity {
			return nil, apperr.InvalidArgument("Not enough stock for material type %d (condition: %s) at source unit: requested %d, available %d", m.MaterialTypeID, m.Condition, m.Quantity, available)
		}
	}

	header := &entities.TransferRequest{
		SourceUnitID:      input.SourceUnitID,
		DestinationUnitID: input.DestinationUnitID,
		DestinationRoomID: input.DestinationRoomID,
		RequestedByUserID: requestedByUserID,
		ApproverUserID:    input.ApproverUserID,
		Status:            entities.TransferRequestStatusPending,
	}
	created, err := s.repo.Create(ctx, header, input.Troopers, input.MaterialAssets, input.MaterialStocks)
	if err != nil {
		return nil, err
	}

	return s.getRequestOrThrow(ctx, created.ID)
}

func (s *service) Find(ctx context.Context, q transferrequests.Query) ([]*entities.TransferRequest, error) {
	return s.repo.Find(ctx, q)
}

func (s *service) FindOne(ctx context.Context, id int64) (*entities.TransferRequest, error) {
	return s.getRequestOrThrow(ctx, id)
}

func (s *service) availableStockQuantity(ctx context.Context, unitIDs []int64, materialTypeID int64, condition entities.MaterialCondition) (int64, error) {
	rows, err := s.materialStockRepo.Find(ctx, nil, unitIDs, 0, materialTypeID)
	if err != nil {
		return 0, err
	}
	var sum int64
	for _, r := range rows {
		if r.Condition == condition {
			sum += r.Quantity
		}
	}
	return sum, nil
}

// moveStock mirrors controller.ts's moveStock: consumes quantity from the
// oldest-first source rows (splitting/deleting as needed) and creates a new
// row at the destination.
func (s *service) moveStock(ctx context.Context, sourceUnitIDs []int64, destinationUnitID int64, destinationRoomID *int64, materialTypeID int64, condition entities.MaterialCondition, quantity int64) error {
	all, err := s.materialStockRepo.Find(ctx, nil, sourceUnitIDs, 0, materialTypeID)
	if err != nil {
		return err
	}

	remaining := quantity
	for _, row := range all {
		if row.Condition != condition {
			continue
		}
		if remaining <= 0 {
			break
		}
		take := remaining
		if row.Quantity < take {
			take = row.Quantity
		}
		remaining -= take
		newQuantity := row.Quantity - take

		if newQuantity == 0 {
			if _, err := s.materialStockRepo.Delete(ctx, []int64{row.ID}); err != nil {
				return err
			}
		} else {
			if _, err := s.materialStockRepo.Update(ctx, row.ID, dbx.Params{"quantity": newQuantity}); err != nil {
				return err
			}
		}
	}

	return s.materialStockRepo.Create(ctx, []*entities.MaterialStock{{
		MaterialTypeID: materialTypeID,
		UnitID:         destinationUnitID,
		RoomID:         destinationRoomID,
		Condition:      condition,
		Quantity:       quantity,
	}})
}

func (s *service) assertActorIsApprover(ctx context.Context, request *entities.TransferRequest, actorUserID int64) error {
	eligibleIDs, err := s.eligibleApproverIDs(ctx, request.SourceUnitID, request.DestinationUnitID)
	if err != nil {
		return err
	}
	if !eligibleIDs[actorUserID] {
		return apperr.PermissionDenied("You don't have permission to approve/reject this transfer request")
	}
	return nil
}

// Approve mirrors controller.ts's approve(): re-validates each item at
// approval time and moves/marks it, tolerating per-item failure so one
// stale item doesn't fail the whole request.
func (s *service) Approve(ctx context.Context, id, actorUserID int64) (*entities.TransferRequest, error) {
	request, err := s.getRequestOrThrow(ctx, id)
	if err != nil {
		return nil, err
	}
	if request.Status != entities.TransferRequestStatusPending {
		return nil, apperr.InvalidArgument("Transfer request is not pending")
	}
	if err := s.assertActorIsApprover(ctx, request, actorUserID); err != nil {
		return nil, err
	}

	sourceUnitID := request.SourceUnitID
	destinationUnitID := request.DestinationUnitID
	destinationRoomID := request.DestinationRoomID
	sourceScopeUnitIDs, err := s.unitAndDescendantIDs(ctx, sourceUnitID)
	if err != nil {
		return nil, err
	}
	scopeSet := idSet(sourceScopeUnitIDs)

	troopers, err := s.repo.FindTroopers(ctx, id)
	if err != nil {
		return nil, err
	}
	for _, item := range troopers {
		failReason := "Trooper no longer belongs to the source unit or one of its subordinate units"

		found, err := s.studentRepo.Find(ctx, []int64{item.StudentID})
		if err != nil {
			return nil, err
		}
		var studentUnitID *int64
		if len(found) > 0 {
			studentUnitID, err = s.studentUnitID(ctx, found[0])
			if err != nil {
				return nil, err
			}
		}
		if len(found) == 0 || studentUnitID == nil || !scopeSet[*studentUnitID] {
			if err := s.repo.SetTrooperItemStatus(ctx, item.ID, entities.TransferRequestItemStatusFailed, &failReason); err != nil {
				return nil, err
			}
			continue
		}

		if _, err := s.studentRepo.Update(ctx, found[0].ID, dbx.Params{"unitId": destinationUnitID, "classId": nil}); err != nil {
			return nil, err
		}
		if err := s.repo.SetTrooperItemStatus(ctx, item.ID, entities.TransferRequestItemStatusApproved, nil); err != nil {
			return nil, err
		}
	}

	materialAssetItems, err := s.repo.FindMaterialAssetItems(ctx, id)
	if err != nil {
		return nil, err
	}
	for _, item := range materialAssetItems {
		failReason := "Material asset no longer belongs to the source unit or one of its subordinate units"

		found, err := s.materialAssetRepo.Find(ctx, materialassets.Filter{Ids: []int64{item.MaterialAssetID}})
		if err != nil {
			return nil, err
		}
		if len(found) == 0 || !scopeSet[found[0].UnitID] {
			if err := s.repo.SetMaterialAssetItemStatus(ctx, item.ID, entities.TransferRequestItemStatusFailed, &failReason); err != nil {
				return nil, err
			}
			continue
		}

		asset := found[0]
		if _, err := s.materialAssetRepo.Update(ctx, asset.ID, dbx.Params{"unitId": destinationUnitID, "roomId": destinationRoomIDValue(destinationRoomID)}); err != nil {
			return nil, err
		}

		prev, _ := jsonUnitValue(sourceUnitID)
		next, _ := jsonUnitValue(destinationUnitID)
		if err := s.materialAssetEvent.Create(ctx, []*entities.MaterialAssetEvent{{
			AssetID:       asset.ID,
			EventType:     entities.MaterialAssetEventTransferred,
			PreviousValue: prev,
			NewValue:      next,
			ActorUserID:   &actorUserID,
		}}); err != nil {
			return nil, err
		}
		if err := s.repo.SetMaterialAssetItemStatus(ctx, item.ID, entities.TransferRequestItemStatusApproved, nil); err != nil {
			return nil, err
		}
	}

	materialStockItems, err := s.repo.FindMaterialStockItems(ctx, id)
	if err != nil {
		return nil, err
	}
	for _, item := range materialStockItems {
		failReason := "Not enough stock remaining at the source unit or its subordinate units"

		available, err := s.availableStockQuantity(ctx, sourceScopeUnitIDs, item.MaterialTypeID, item.Condition)
		if err != nil {
			return nil, err
		}
		if available < item.Quantity {
			if err := s.repo.SetMaterialStockItemStatus(ctx, item.ID, entities.TransferRequestItemStatusFailed, &failReason); err != nil {
				return nil, err
			}
			continue
		}

		if err := s.moveStock(ctx, sourceScopeUnitIDs, destinationUnitID, destinationRoomID, item.MaterialTypeID, item.Condition, item.Quantity); err != nil {
			return nil, err
		}
		if err := s.repo.SetMaterialStockItemStatus(ctx, item.ID, entities.TransferRequestItemStatusApproved, nil); err != nil {
			return nil, err
		}
	}

	decidedAt := time.Now().UTC().Format(time.RFC3339)
	if _, err := s.repo.Update(ctx, []transferrequests.UpdateParam{{
		ID: id,
		Cols: dbx.Params{
			"status":          entities.TransferRequestStatusApproved,
			"decidedByUserId": actorUserID,
			"decidedAt":       decidedAt,
		},
	}}); err != nil {
		return nil, err
	}

	return s.getRequestOrThrow(ctx, id)
}

// Reject mirrors controller.ts's reject().
func (s *service) Reject(ctx context.Context, id, actorUserID int64, rejectionReason string) (*entities.TransferRequest, error) {
	request, err := s.getRequestOrThrow(ctx, id)
	if err != nil {
		return nil, err
	}
	if request.Status != entities.TransferRequestStatusPending {
		return nil, apperr.InvalidArgument("Transfer request is not pending")
	}
	if err := s.assertActorIsApprover(ctx, request, actorUserID); err != nil {
		return nil, err
	}

	decidedAt := time.Now().UTC().Format(time.RFC3339)
	if _, err := s.repo.Update(ctx, []transferrequests.UpdateParam{{
		ID: id,
		Cols: dbx.Params{
			"status":          entities.TransferRequestStatusRejected,
			"decidedByUserId": actorUserID,
			"decidedAt":       decidedAt,
			"rejectionReason": rejectionReason,
		},
	}}); err != nil {
		return nil, err
	}

	return s.getRequestOrThrow(ctx, id)
}

// Cancel mirrors controller.ts's cancel().
func (s *service) Cancel(ctx context.Context, id, actorUserID int64) (*entities.TransferRequest, error) {
	request, err := s.getRequestOrThrow(ctx, id)
	if err != nil {
		return nil, err
	}
	if request.Status != entities.TransferRequestStatusPending {
		return nil, apperr.InvalidArgument("Transfer request is not pending")
	}
	if request.RequestedByUserID != actorUserID {
		return nil, apperr.PermissionDenied("Only the requester can cancel this transfer request")
	}

	decidedAt := time.Now().UTC().Format(time.RFC3339)
	if _, err := s.repo.Update(ctx, []transferrequests.UpdateParam{{
		ID: id,
		Cols: dbx.Params{
			"status":          entities.TransferRequestStatusCancelled,
			"decidedByUserId": actorUserID,
			"decidedAt":       decidedAt,
		},
	}}); err != nil {
		return nil, err
	}

	return s.getRequestOrThrow(ctx, id)
}

// TrooperDetail, MaterialAssetItemDetail, MaterialStockItemDetail, and
// Detail mirror schema/transfer-requests.ts's TransferRequestTrooper/
// TransferRequestMaterialAssetItem/TransferRequestMaterialStockItem/
// TransferRequest — the "with relations" shape repo.ts's WITH_DETAILS
// produces via Drizzle's relational query builder. dbx has no equivalent
// eager loader, so LoadDetail below composes the same shape by calling
// each resource's own repo directly.
type TrooperDetail struct {
	*entities.TransferRequestTrooper
	Student *entities.Student
}

type MaterialAssetItemDetail struct {
	*entities.TransferRequestMaterialAsset
	MaterialAsset *entities.MaterialAsset
}

type MaterialStockItemDetail struct {
	*entities.TransferRequestMaterialStock
	MaterialType *entities.MaterialType
}

type Detail struct {
	*entities.TransferRequest
	SourceUnit         *entities.Unit
	DestinationUnit    *entities.Unit
	DestinationRoom    *entities.Room
	RequestedBy        *entities.User
	Approver           *entities.User
	DecidedBy          *entities.User
	Troopers           []TrooperDetail
	MaterialAssetItems []MaterialAssetItemDetail
	MaterialStockItems []MaterialStockItemDetail
}

func firstOrNil[T any](rows []*T) *T {
	if len(rows) == 0 {
		return nil
	}
	return rows[0]
}

// LoadDetail mirrors repo.ts's WITH_DETAILS.
func (s *service) LoadDetail(ctx context.Context, tr *entities.TransferRequest) (*Detail, error) {
	sourceUnits, err := s.unitRepo.Find(ctx, []int64{tr.SourceUnitID}, "")
	if err != nil {
		return nil, err
	}
	destUnits, err := s.unitRepo.Find(ctx, []int64{tr.DestinationUnitID}, "")
	if err != nil {
		return nil, err
	}
	requestedByRows, err := s.userRepo.Find(ctx, []int64{tr.RequestedByUserID})
	if err != nil {
		return nil, err
	}
	approverRows, err := s.userRepo.Find(ctx, []int64{tr.ApproverUserID})
	if err != nil {
		return nil, err
	}

	d := &Detail{
		TransferRequest: tr,
		SourceUnit:      firstOrNil(sourceUnits),
		DestinationUnit: firstOrNil(destUnits),
		RequestedBy:     firstOrNil(requestedByRows),
		Approver:        firstOrNil(approverRows),
	}

	if tr.DestinationRoomID != nil {
		room, err := s.roomRepo.FindOne(ctx, *tr.DestinationRoomID)
		if err == nil {
			d.DestinationRoom = room
		}
	}
	if tr.DecidedByUserID != nil {
		decidedByRows, err := s.userRepo.Find(ctx, []int64{*tr.DecidedByUserID})
		if err != nil {
			return nil, err
		}
		d.DecidedBy = firstOrNil(decidedByRows)
	}

	troopers, err := s.repo.FindTroopers(ctx, tr.ID)
	if err != nil {
		return nil, err
	}
	for _, item := range troopers {
		detail := TrooperDetail{TransferRequestTrooper: item}
		if found, err := s.studentRepo.Find(ctx, []int64{item.StudentID}); err == nil {
			detail.Student = firstOrNil(found)
		}
		d.Troopers = append(d.Troopers, detail)
	}

	materialAssetItems, err := s.repo.FindMaterialAssetItems(ctx, tr.ID)
	if err != nil {
		return nil, err
	}
	for _, item := range materialAssetItems {
		detail := MaterialAssetItemDetail{TransferRequestMaterialAsset: item}
		if found, err := s.materialAssetRepo.Find(ctx, materialassets.Filter{Ids: []int64{item.MaterialAssetID}}); err == nil {
			detail.MaterialAsset = firstOrNil(found)
		}
		d.MaterialAssetItems = append(d.MaterialAssetItems, detail)
	}

	materialStockItems, err := s.repo.FindMaterialStockItems(ctx, tr.ID)
	if err != nil {
		return nil, err
	}
	for _, item := range materialStockItems {
		detail := MaterialStockItemDetail{TransferRequestMaterialStock: item}
		if found, err := s.materialTypeRepo.Find(ctx, []int64{item.MaterialTypeID}, ""); err == nil {
			detail.MaterialType = firstOrNil(found)
		}
		d.MaterialStockItems = append(d.MaterialStockItems, detail)
	}

	return d, nil
}

func destinationRoomIDValue(id *int64) any {
	if id == nil {
		return nil
	}
	return *id
}

func jsonUnitValue(unitID int64) (entities.JSONText, error) {
	b, err := json.Marshal(map[string]int64{"unitId": unitID})
	if err != nil {
		return "", err
	}
	return entities.JSONText(b), nil
}
