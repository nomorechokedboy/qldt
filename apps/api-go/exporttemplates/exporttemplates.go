// Package exporttemplates exposes CRUD over uploaded .docx export
// templates, mirroring apps/api/export-templates. Upload and the static
// example-template download are raw endpoints (multipart form / binary
// response); list and delete are typed JSON endpoints like the rest of this
// app's bare-CRUD resources.
package exporttemplates

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"encore.app/authn"
	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/exporttemplates"
	"encore.app/internal/objectstorage"
	"encore.dev/beta/auth"
)

var repo *exporttemplates.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("exporttemplates: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("exporttemplates: run migrations: %w", err))
	}

	repo = exporttemplates.NewRepository(conn)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func currentUserID() *int64 {
	authData, ok := auth.Data().(*authn.AuthData)
	if !ok || authData == nil {
		return nil
	}
	id := authData.UserID
	return &id
}

//encore:api auth raw method=POST path=/export-templates tag:audited
func UploadExportTemplate(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	if err := req.ParseMultipartForm(32 << 20); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	resourceType := entities.ExportResourceType(req.FormValue("resourceType"))
	if !resourceType.Valid() {
		writeJSONError(w, http.StatusBadRequest, fmt.Sprintf("resourceType must be one of %s, %s, %s",
			entities.ExportResourceMaterialAssets, entities.ExportResourceStudents, entities.ExportResourceMaterialStocks))
		return
	}

	file, header, err := req.FormFile("file")
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".docx") {
		writeJSONError(w, http.StatusBadRequest, "template file must be a .docx file")
		return
	}

	name := req.FormValue("name")
	if name == "" {
		name = header.Filename
	}

	s3Key := fmt.Sprintf("export-templates/%s/%d-%s", resourceType, time.Now().UnixMilli(), header.Filename)

	writer := objectstorage.Bucket.Upload(ctx, s3Key)
	if _, err := io.Copy(writer, file); err != nil {
		writer.Abort(err)
		writeJSONError(w, http.StatusInternalServerError, "failed to upload template")
		return
	}
	if err := writer.Close(); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "failed to upload template")
		return
	}

	row := &entities.ExportTemplate{
		Name:             name,
		ResourceType:     resourceType,
		S3Key:            s3Key,
		OriginalFilename: header.Filename,
		UploadedByUserID: currentUserID(),
	}
	if err := repo.Create(ctx, row); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "failed to save export template")
		return
	}

	auditctx.SetContext(ctx, []any{row.ID}, nil, row)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"data": row})
}

type GetExportTemplatesRequest struct {
	ResourceType string `query:"resourceType"`
}

type GetExportTemplatesResponse struct {
	Data []*entities.ExportTemplate `json:"data"`
}

//encore:api auth method=GET path=/export-templates
func GetExportTemplates(ctx context.Context, req *GetExportTemplatesRequest) (*GetExportTemplatesResponse, error) {
	if req.ResourceType != "" && !entities.ExportResourceType(req.ResourceType).Valid() {
		return nil, apperr.Wrap(apperr.InvalidArgument("invalid resourceType: %q", req.ResourceType))
	}

	rows, err := repo.Find(ctx, entities.ExportResourceType(req.ResourceType))
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &GetExportTemplatesResponse{Data: rows}, nil
}

//encore:api auth raw method=GET path=/export-templates/example
func DownloadExampleExportTemplate(w http.ResponseWriter, req *http.Request) {
	resourceType := req.URL.Query().Get("resourceType")

	filename := "dynamic-docx-template.docx"
	if resourceType == "students" {
		filename = "dynamic-docx-template-students-example.docx"
	}

	buf, err := os.ReadFile(filepath.Join("templates", filename))
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "internal error downloading example template")
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
	w.Header().Set("Content-Disposition", `attachment; filename="mau-vi-du.docx"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(buf)
}

type DeleteExportTemplateResponse struct {
	ID int64 `json:"id"`
}

//encore:api auth method=DELETE path=/export-templates/:id tag:audited
func DeleteExportTemplate(ctx context.Context, id int64) (*DeleteExportTemplateResponse, error) {
	deleted, err := repo.Delete(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("export template %d not found", id))
	}

	if err := objectstorage.Bucket.Remove(ctx, deleted.S3Key); err != nil {
		return nil, apperr.Wrap(fmt.Errorf("export_templates: remove object: %w", err))
	}

	auditctx.SetContext(ctx, []any{id}, deleted, nil)

	return &DeleteExportTemplateResponse{ID: id}, nil
}
