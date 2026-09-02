package entities

// UserRole mirrors apps/api/schema/user-roles.ts's user_roles join table
// (composite PK user_id+role_id, no own id column).
type UserRole struct {
	UserID    int64  `db:"user_id" json:"userId"`
	RoleID    int64  `db:"role_id" json:"roleId"`
	CreatedAt string `db:"created_at" json:"createdAt"`
}
