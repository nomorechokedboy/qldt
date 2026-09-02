package entities

// ExportResourceType mirrors apps/api/schema/export-templates.ts's
// ExportResourceType.
type ExportResourceType string

const (
	ExportResourceMaterialAssets ExportResourceType = "material_assets"
	ExportResourceStudents       ExportResourceType = "students"
	ExportResourceMaterialStocks ExportResourceType = "material_stocks"
)

func (t ExportResourceType) Valid() bool {
	switch t {
	case ExportResourceMaterialAssets, ExportResourceStudents, ExportResourceMaterialStocks:
		return true
	default:
		return false
	}
}

// ExportTemplate mirrors apps/api/schema/export-templates.ts's
// export_templates table. The uploaded .docx itself lives in object storage
// (see internal/objectstorage) under S3Key — this row is just the pointer +
// metadata.
type ExportTemplate struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Name             string             `db:"name" json:"name"`
	ResourceType     ExportResourceType `db:"resource_type" json:"resourceType"`
	S3Key            string             `db:"s3_key" json:"s3Key"`
	OriginalFilename string             `db:"original_filename" json:"originalFilename"`
	UploadedByUserID *int64             `db:"uploaded_by_user_id" json:"uploadedByUserId"`
}

func (ExportTemplate) TableName() string { return "export_templates" }
