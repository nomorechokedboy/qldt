// Package exporttemplates is the persistence layer for the
// export_templates table. Mirrors apps/api/export-templates/repo.ts.
package exporttemplates

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

func (r *Repository) Create(ctx context.Context, row *entities.ExportTemplate) error {
	if err := r.db.WithContext(ctx).Model(row).Insert(); err != nil {
		return fmt.Errorf("export_templates: insert: %w", err)
	}
	return nil
}

func (r *Repository) Find(ctx context.Context, resourceType entities.ExportResourceType) ([]*entities.ExportTemplate, error) {
	q := r.db.WithContext(ctx).Select("*").From("export_templates").OrderBy("id")
	if resourceType != "" {
		q = q.Where(dbx.HashExp{"resource_type": resourceType})
	}

	var rows []*entities.ExportTemplate
	if err := q.All(&rows); err != nil {
		return nil, fmt.Errorf("export_templates: find: %w", err)
	}

	return rows, nil
}

func (r *Repository) FindOne(ctx context.Context, id int64) (*entities.ExportTemplate, error) {
	var row entities.ExportTemplate
	err := r.db.WithContext(ctx).
		Select("*").
		From("export_templates").
		Where(dbx.HashExp{"id": id}).
		One(&row)
	if err != nil {
		return nil, fmt.Errorf("export_templates: find one: %w", err)
	}

	return &row, nil
}

func (r *Repository) Delete(ctx context.Context, id int64) (*entities.ExportTemplate, error) {
	row, err := r.FindOne(ctx, id)
	if err != nil {
		return nil, err
	}

	_, err = r.db.WithContext(ctx).Delete("export_templates", dbx.HashExp{"id": id}).Execute()
	if err != nil {
		return nil, fmt.Errorf("export_templates: delete: %w", err)
	}

	return row, nil
}
