// Package entities holds the persistence-layer structs shared between the
// students repository and its API layer.
package entities

// PoliticalOrg mirrors schema/student.ts's PoliticalOrgEnum custom type.
type PoliticalOrg string

const (
	PoliticalOrgHCYU PoliticalOrg = "hcyu"
	PoliticalOrgCPV  PoliticalOrg = "cpv"
)

// Status mirrors schema/student.ts's status enum.
type Status string

const (
	StatusPending   Status = "pending"
	StatusConfirmed Status = "confirmed"
)

// Student is the students table row. Field order and `db` tags match the
// SQLite columns created by apps/api's Drizzle migrations, so this struct
// can read/write the exact same table.
type Student struct {
	ID        int64  `json:"id"                  db:"pk"`
	CreatedAt string `json:"createdAt,omitempty" db:"createdAt"`
	UpdatedAt string `json:"updatedAt,omitempty" db:"updatedAt"`

	FullName                 string       `json:"fullName"                 db:"fullName"`
	BirthPlace               string       `json:"birthPlace"               db:"birthPlace"`
	Address                  string       `json:"address"                  db:"address"`
	Dob                      string       `json:"dob"                      db:"dob"`
	Rank                     string       `json:"rank"                     db:"rank"`
	PreviousUnit             string       `json:"previousUnit"             db:"previousUnit"`
	PreviousPosition         string       `json:"previousPosition"         db:"previousPosition"`
	Position                 string       `json:"position"                 db:"position"`
	Ethnic                   string       `json:"ethnic"                   db:"ethnic"`
	Religion                 string       `json:"religion"                 db:"religion"`
	EnlistmentPeriod         string       `json:"enlistmentPeriod"         db:"enlistmentPeriod"`
	PoliticalOrg             PoliticalOrg `json:"politicalOrg"             db:"politicalOrg"`
	PoliticalOrgOfficialDate string       `json:"politicalOrgOfficialDate" db:"politicalOrgOfficialDate"`
	CpvID                    *string      `json:"cpvId,omitempty"          db:"cpvId"`
	EducationLevel           string       `json:"educationLevel"           db:"educationLevel"`
	SchoolName               string       `json:"schoolName"               db:"schoolName"`
	Major                    string       `json:"major"                    db:"major"`
	IsGraduated              bool         `json:"isGraduated"              db:"isGraduated"`
	Talent                   string       `json:"talent"                   db:"talent"`
	Shortcoming              string       `json:"shortcoming"              db:"shortcoming"`
	PolicyBeneficiaryGroup   string       `json:"policyBeneficiaryGroup"   db:"policyBeneficiaryGroup"`
	FatherName               string       `json:"fatherName"               db:"fatherName"`
	FatherDob                string       `json:"fatherDob"                db:"fatherDob"`
	FatherPhoneNumber        string       `json:"fatherPhoneNumber"        db:"fatherPhoneNumber"`
	FatherJob                string       `json:"fatherJob"                db:"fatherJob"`
	MotherName               string       `json:"motherName"               db:"motherName"`
	MotherDob                string       `json:"motherDob"                db:"motherDob"`
	MotherPhoneNumber        string       `json:"motherPhoneNumber"        db:"motherPhoneNumber"`
	MotherJob                string       `json:"motherJob"                db:"motherJob"`
	IsMarried                bool         `json:"isMarried"                db:"isMarried"`
	SpouseName               string       `json:"spouseName"               db:"spouseName"`
	SpouseDob                string       `json:"spouseDob"                db:"spouseDob"`
	SpouseJob                string       `json:"spouseJob"                db:"spouseJob"`
	SpousePhoneNumber        string       `json:"spousePhoneNumber"        db:"spousePhoneNumber"`
	// ChildrenInfos/Siblings/ContactPerson are stored as raw JSON text
	// (matching the "text" column affinity apps/api's Drizzle schema
	// declares), not driver-level BLOBs, so apps/api can keep reading them
	// as JSON strings.
	ChildrenInfos         JSONText `json:"childrenInfos"            db:"childrenInfos"`
	FamilySize            *int64   `json:"familySize,omitempty"     db:"familySize"`
	FamilyBackground      string   `json:"familyBackground"         db:"familyBackground"`
	FamilyBirthOrder      string   `json:"familyBirthOrder"         db:"familyBirthOrder"`
	Achievement           string   `json:"achievement"              db:"achievement"`
	DisciplinaryHistory   string   `json:"disciplinaryHistory"      db:"disciplinaryHistory"`
	Phone                 string   `json:"phone"                    db:"phone"`
	ClassID               *int64   `json:"classId,omitempty"        db:"classId"`
	UnitID                *int64   `json:"unitId,omitempty"         db:"unitId"`
	CpvOfficialAt         *string  `json:"cpvOfficialAt,omitempty"  db:"cpvOfficialAt"`
	Avatar                *string  `json:"avatar,omitempty"         db:"avatar"`
	Siblings              JSONText `json:"siblings"                 db:"siblings"`
	ContactPerson         JSONText `json:"contactPerson"            db:"contactPerson"`
	StudentID             *string  `json:"studentId,omitempty"      db:"studentId"`
	RelatedDocumentations *string  `json:"relatedDocumentations,omitempty" db:"relatedDocumentations"`
	Status                Status   `json:"status"                   db:"status"`
}

// TableName implements dbx.TableModel — the struct name would otherwise be
// mapped to "student", not the actual "students" table.
func (Student) TableName() string {
	return "students"
}
