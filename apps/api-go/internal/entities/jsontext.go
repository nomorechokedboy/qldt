package entities

import (
	"database/sql/driver"
	"fmt"
)

// JSONText is a column stored as raw JSON text (SQLite "text" affinity) that
// should still round-trip as real JSON — not a doubly-escaped string — in
// this app's own JSON API. It implements both database/sql's Valuer/Scanner
// (so dbx reads/writes it as TEXT, matching apps/api's Drizzle "json mode"
// columns) and json.Marshaler/Unmarshaler (so it serializes as a nested
// value, not a string).
type JSONText string

func (j JSONText) Value() (driver.Value, error) {
	return string(j), nil
}

func (j *JSONText) Scan(src any) error {
	switch v := src.(type) {
	case nil:
		*j = ""
	case string:
		*j = JSONText(v)
	case []byte:
		*j = JSONText(v)
	default:
		return fmt.Errorf("entities: JSONText: unsupported scan type %T", src)
	}
	return nil
}

func (j JSONText) MarshalJSON() ([]byte, error) {
	if j == "" {
		return []byte("null"), nil
	}
	return []byte(j), nil
}

func (j *JSONText) UnmarshalJSON(data []byte) error {
	*j = JSONText(data)
	return nil
}
