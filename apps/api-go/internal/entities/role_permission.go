package entities

// RolePermission mirrors apps/api/schema/role-permissions.ts's
// role_permissions join table (composite PK role_id+permission_id, no own
// id column).
type RolePermission struct {
	RoleID       int64  `db:"role_id" json:"roleId"`
	PermissionID int64  `db:"permission_id" json:"permissionId"`
	CreatedAt    string `db:"created_at" json:"createdAt"`
}
