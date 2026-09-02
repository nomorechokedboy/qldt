package db

import (
	"embed"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	dbxlib "github.com/pocketbase/dbx"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

// RunMigrations applies all pending UP migrations. Safe to call on every
// service startup — golang-migrate is idempotent.
func RunMigrations(db *dbxlib.DB) error {
	sqlDB := db.DB()

	driver, err := sqlite3.WithInstance(sqlDB, &sqlite3.Config{
		// Dedicated tracking table so this doesn't collide with the
		// Drizzle-managed __drizzle_migrations table when pointed at the
		// same database file as apps/api.
		MigrationsTable: "api_go_schema_migrations",
	})
	if err != nil {
		return fmt.Errorf("db: migrate driver: %w", err)
	}

	src, err := iofs.New(migrationFiles, "migrations")
	if err != nil {
		return fmt.Errorf("db: migrate source: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", src, "sqlite3", driver)
	if err != nil {
		return fmt.Errorf("db: migrate instance: %w", err)
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("db: migrate up: %w", err)
	}

	return nil
}
