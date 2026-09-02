package entities

// UserStatus mirrors apps/api/schema/users.ts's StatusEnum.
type UserStatus string

const (
	UserStatusPending  UserStatus = "pending"
	UserStatusApproved UserStatus = "approved"
)

// User mirrors apps/api/schema/users.ts's users table.
//
// Password is hashed with Go's argon2id (golang.org/x/crypto/argon2, no
// secret/pepper param — see internal/authn/password.go) which is NOT
// byte-compatible with apps/api's node-argon2 hashes (those use a secret
// pepper the Go standard library doesn't support). A user created or
// password-updated through this Go endpoint cannot log in via apps/api's
// TS auth service until login itself is ported to Go — see README.md.
type User struct {
	ID        int64  `db:"pk" json:"id"`
	CreatedAt string `db:"createdAt" json:"createdAt"`
	UpdatedAt string `db:"updatedAt" json:"updatedAt"`

	Username    string     `db:"username" json:"username"`
	Password    string     `db:"password" json:"-"`
	DisplayName string     `db:"displayName" json:"displayName"`
	IsSuperUser bool       `db:"isSuperUser" json:"isSuperUser"`
	UnitID      *int64     `db:"unitId" json:"unitId"`
	Status      UserStatus `db:"status" json:"status"`
	Rank        *string    `db:"rank" json:"rank"`
	Position    *string    `db:"position" json:"position"`
	Alias       *string    `db:"alias" json:"alias"`
}

func (User) TableName() string { return "users" }
