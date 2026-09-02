package entities

// TransferRequestStatus mirrors apps/api/schema/transfer-requests.ts's
// TransferRequestStatus.
type TransferRequestStatus string

const (
	TransferRequestStatusPending   TransferRequestStatus = "pending"
	TransferRequestStatusApproved  TransferRequestStatus = "approved"
	TransferRequestStatusRejected  TransferRequestStatus = "rejected"
	TransferRequestStatusCancelled TransferRequestStatus = "cancelled"
)

func (s TransferRequestStatus) Valid() bool {
	switch s {
	case TransferRequestStatusPending, TransferRequestStatusApproved, TransferRequestStatusRejected, TransferRequestStatusCancelled:
		return true
	default:
		return false
	}
}

// TransferRequestItemStatus mirrors apps/api/schema/transfer-requests.ts's
// TransferRequestItemStatus — a per-line-item status, since a mixed-resource
// request can partially fail at approval time without failing items that
// are still valid.
type TransferRequestItemStatus string

const (
	TransferRequestItemStatusPending  TransferRequestItemStatus = "pending"
	TransferRequestItemStatusApproved TransferRequestItemStatus = "approved"
	TransferRequestItemStatusFailed   TransferRequestItemStatus = "failed"
)

func (s TransferRequestItemStatus) Valid() bool {
	switch s {
	case TransferRequestItemStatusPending, TransferRequestItemStatusApproved, TransferRequestItemStatusFailed:
		return true
	default:
		return false
	}
}

// TransferRequest mirrors apps/api/schema/transfer-requests.ts's
// transfer_requests table.
type TransferRequest struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	SourceUnitID      int64  `db:"sourceUnitId" json:"sourceUnitId"`
	DestinationUnitID int64  `db:"destinationUnitId" json:"destinationUnitId"`
	DestinationRoomID *int64 `db:"destinationRoomId" json:"destinationRoomId"`

	RequestedByUserID int64   `db:"requestedByUserId" json:"requestedByUserId"`
	ApproverUserID    int64   `db:"approverUserId" json:"approverUserId"`
	DecidedByUserID   *int64  `db:"decidedByUserId" json:"decidedByUserId"`
	DecidedAt         *string `db:"decidedAt" json:"decidedAt"`

	Status          TransferRequestStatus `db:"status" json:"status"`
	RejectionReason *string               `db:"rejectionReason" json:"rejectionReason"`
}

func (TransferRequest) TableName() string { return "transfer_requests" }

// TransferRequestTrooper mirrors apps/api/schema/transfer-requests.ts's
// transfer_request_troopers table.
type TransferRequestTrooper struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	TransferRequestID int64                     `db:"transferRequestId" json:"transferRequestId"`
	StudentID         int64                     `db:"studentId" json:"studentId"`
	ItemStatus        TransferRequestItemStatus `db:"itemStatus" json:"itemStatus"`
	FailureReason     *string                   `db:"failureReason" json:"failureReason"`
}

func (TransferRequestTrooper) TableName() string { return "transfer_request_troopers" }

// TransferRequestMaterialAsset mirrors apps/api/schema/transfer-requests.ts's
// transfer_request_material_assets table.
type TransferRequestMaterialAsset struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	TransferRequestID int64                     `db:"transferRequestId" json:"transferRequestId"`
	MaterialAssetID   int64                     `db:"materialAssetId" json:"materialAssetId"`
	ItemStatus        TransferRequestItemStatus `db:"itemStatus" json:"itemStatus"`
	FailureReason     *string                   `db:"failureReason" json:"failureReason"`
}

func (TransferRequestMaterialAsset) TableName() string {
	return "transfer_request_material_assets"
}

// TransferRequestMaterialStock mirrors apps/api/schema/transfer-requests.ts's
// transfer_request_material_stocks table.
type TransferRequestMaterialStock struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	TransferRequestID int64                     `db:"transferRequestId" json:"transferRequestId"`
	MaterialTypeID    int64                     `db:"materialTypeId" json:"materialTypeId"`
	Condition         MaterialCondition         `db:"condition" json:"condition"`
	Quantity          int64                     `db:"quantity" json:"quantity"`
	ItemStatus        TransferRequestItemStatus `db:"itemStatus" json:"itemStatus"`
	FailureReason     *string                   `db:"failureReason" json:"failureReason"`
}

func (TransferRequestMaterialStock) TableName() string {
	return "transfer_request_material_stocks"
}
