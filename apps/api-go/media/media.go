// Package media exposes raw file upload/download endpoints backed by
// object storage, mirroring apps/api/media. There is no DB table — a
// file's identity is just its bucket key, returned as the upload response's
// "uri" and used directly as the :fileUri path param on download.
package media

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"encore.app/authn"
	"encore.app/internal/logger"
	"encore.app/internal/objectstorage"
	encore "encore.dev"
	"encore.dev/beta/auth"
	"encore.dev/storage/objects"
)

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

//encore:api auth raw method=POST path=/media/upload
func UploadFiles(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	authData, ok := auth.Data().(*authn.AuthData)
	if !ok || authData == nil {
		writeJSONError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	logger.InfoContext(ctx, "Starting file upload", "userId", authData.UserID)

	if err := req.ParseMultipartForm(32 << 20); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	uris := make([]string, 0)
	for _, headers := range req.MultipartForm.File {
		for _, header := range headers {
			file, err := header.Open()
			if err != nil {
				writeJSONError(w, http.StatusBadRequest, "failed to read uploaded file")
				return
			}

			key := fmt.Sprintf("%d-%s", authData.UserID, header.Filename)
			writer := objectstorage.Bucket.Upload(ctx, key)
			if _, err := io.Copy(writer, file); err != nil {
				file.Close()
				writer.Abort(err)
				logger.ErrorContext(ctx, "Upload error", "err", err)
				writeJSONError(w, http.StatusInternalServerError, "failed to upload file")
				return
			}
			file.Close()
			if err := writer.Close(); err != nil {
				logger.ErrorContext(ctx, "Upload error", "err", err)
				writeJSONError(w, http.StatusInternalServerError, "failed to upload file")
				return
			}

			uris = append(uris, key)
		}
	}

	logger.InfoContext(ctx, "Files saved successfully", "count", len(uris))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"data": map[string]any{"uris": uris}})
}

//encore:api public raw method=GET path=/media/:fileUri
func GetMedia(w http.ResponseWriter, req *http.Request) {
	fileUri := encore.CurrentRequest().PathParams.Get("fileUri")
	if fileUri == "" {
		writeJSONError(w, http.StatusBadRequest, "File URI is required")
		return
	}

	ctx := req.Context()

	logger.InfoContext(ctx, "Fetching media file", "fileUri", fileUri)

	attrs, err := objectstorage.Bucket.Attrs(ctx, fileUri)
	if err != nil {
		if errors.Is(err, objects.ErrObjectNotFound) {
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "File not found"})
			return
		}
		logger.ErrorContext(ctx, "Error serving media", "err", err)
		writeJSONError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	reader := objectstorage.Bucket.Download(ctx, fileUri)
	defer reader.Close()

	contentType := attrs.ContentType
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", attrs.Size))
	w.Header().Set("Cache-Control", "public, max-age=31536000")
	w.Header().Set("ETag", fmt.Sprintf("%q", fileUri))

	if _, err := io.Copy(w, reader); err != nil {
		logger.ErrorContext(ctx, "Stream error", "err", err, "fileUri", fileUri)
		return
	}
}
