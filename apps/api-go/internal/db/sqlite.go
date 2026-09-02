// Package db owns the SQLite connection and schema migrations shared by all
// repositories in this app.
package db

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"

	_ "github.com/mattn/go-sqlite3"
	"github.com/pocketbase/dbx"
)

// New opens (creating if necessary) the SQLite database at uri and enables
// foreign key enforcement, which SQLite otherwise leaves off by default.
func New(uri string) (*dbx.DB, error) {
	path := strings.TrimPrefix(uri, "file:")

	dir := filepath.Dir(path)
	if err := ensureDir(dir); err != nil {
		return nil, fmt.Errorf("db: create data dir: %w", err)
	}

	dsn := fmt.Sprintf("%s?_foreign_keys=on&_journal_mode=WAL", path)
	sqlDB, err := dbx.MustOpen("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("db: open sqlite: %w", err)
	}
	sqlDB.LogFunc = log.Printf

	return sqlDB, nil
}
