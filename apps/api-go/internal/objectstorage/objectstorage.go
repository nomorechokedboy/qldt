// Package objectstorage declares this app's Encore Bucket. It mirrors
// apps/api/objectStorage/minio.ts's single-bucket-many-prefixes layout (one
// S3_DEFAULT_BUCKET, keys like "export-templates/<type>/<ts>-<name>") but
// through Encore's Object Storage API instead of a hand-rolled S3 client —
// same underlying S3-compatible storage (self-hosted MinIO included) in
// production, wired via Encore infra config rather than app code, with
// zero-setup local-disk storage under `encore run`.
package objectstorage

import "encore.dev/storage/objects"

var Bucket = objects.NewBucket("app-storage", objects.BucketConfig{})
