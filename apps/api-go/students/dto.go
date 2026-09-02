package students

import (
	"encoding/json"
	"fmt"

	"encore.app/internal/entities"
	"github.com/pocketbase/dbx"
)

// CreateStudentInput mirrors apps/api's students/controller.ts StudentBody.
type CreateStudentInput struct {
	FullName                 string          `json:"fullName"`
	BirthPlace               string          `json:"birthPlace"`
	Address                  string          `json:"address"`
	Dob                      string          `json:"dob"`
	Rank                     string          `json:"rank"`
	PreviousUnit             string          `json:"previousUnit"`
	PreviousPosition         string          `json:"previousPosition"`
	Position                 string          `json:"position"`
	Ethnic                   string          `json:"ethnic"`
	Religion                 string          `json:"religion"`
	EnlistmentPeriod         string          `json:"enlistmentPeriod"`
	PoliticalOrg             string          `json:"politicalOrg"`
	PoliticalOrgOfficialDate string          `json:"politicalOrgOfficialDate"`
	CpvID                    *string         `json:"cpvId,omitempty"`
	EducationLevel           string          `json:"educationLevel"`
	SchoolName               string          `json:"schoolName"`
	Major                    string          `json:"major"`
	IsGraduated              bool            `json:"isGraduated"`
	Talent                   string          `json:"talent"`
	Shortcoming              string          `json:"shortcoming"`
	PolicyBeneficiaryGroup   string          `json:"policyBeneficiaryGroup"`
	FatherName               string          `json:"fatherName"`
	FatherDob                string          `json:"fatherDob"`
	FatherPhoneNumber        string          `json:"fatherPhoneNumber"`
	FatherJob                string          `json:"fatherJob"`
	MotherName               string          `json:"motherName"`
	MotherDob                string          `json:"motherDob"`
	MotherPhoneNumber        string          `json:"motherPhoneNumber"`
	MotherJob                string          `json:"motherJob"`
	IsMarried                bool            `json:"isMarried"`
	SpouseName               string          `json:"spouseName"`
	SpouseDob                string          `json:"spouseDob"`
	SpouseJob                string          `json:"spouseJob"`
	SpousePhoneNumber        string          `json:"spousePhoneNumber"`
	ChildrenInfos            json.RawMessage `json:"childrenInfos,omitempty"`
	FamilySize               *int64          `json:"familySize,omitempty"`
	FamilyBackground         string          `json:"familyBackground"`
	FamilyBirthOrder         string          `json:"familyBirthOrder"`
	Achievement              string          `json:"achievement"`
	DisciplinaryHistory      string          `json:"disciplinaryHistory"`
	Phone                    string          `json:"phone"`
	ClassID                  *int64          `json:"classId,omitempty"`
	UnitID                   *int64          `json:"unitId,omitempty"`
	Avatar                   *string         `json:"avatar,omitempty"`
	Siblings                 json.RawMessage `json:"siblings,omitempty"`
	ContactPerson            json.RawMessage `json:"contactPerson,omitempty"`
	StudentID                *string         `json:"studentId,omitempty"`
	RelatedDocumentations    *string         `json:"relatedDocumentations,omitempty"`
	Status                   string          `json:"status,omitempty"`
}

func rawOrDefault(raw json.RawMessage, def string) entities.JSONText {
	if len(raw) == 0 {
		return entities.JSONText(def)
	}
	return entities.JSONText(raw)
}

func (in CreateStudentInput) toEntity() *entities.Student {
	status := entities.Status(in.Status)
	if status == "" {
		status = entities.StatusPending
	}

	return &entities.Student{
		FullName:                 in.FullName,
		BirthPlace:               in.BirthPlace,
		Address:                  in.Address,
		Dob:                      in.Dob,
		Rank:                     in.Rank,
		PreviousUnit:             in.PreviousUnit,
		PreviousPosition:         in.PreviousPosition,
		Position:                 in.Position,
		Ethnic:                   in.Ethnic,
		Religion:                 in.Religion,
		EnlistmentPeriod:         in.EnlistmentPeriod,
		PoliticalOrg:             entities.PoliticalOrg(in.PoliticalOrg),
		PoliticalOrgOfficialDate: in.PoliticalOrgOfficialDate,
		CpvID:                    in.CpvID,
		EducationLevel:           in.EducationLevel,
		SchoolName:               in.SchoolName,
		Major:                    in.Major,
		IsGraduated:              in.IsGraduated,
		Talent:                   in.Talent,
		Shortcoming:              in.Shortcoming,
		PolicyBeneficiaryGroup:   in.PolicyBeneficiaryGroup,
		FatherName:               in.FatherName,
		FatherDob:                in.FatherDob,
		FatherPhoneNumber:        in.FatherPhoneNumber,
		FatherJob:                in.FatherJob,
		MotherName:               in.MotherName,
		MotherDob:                in.MotherDob,
		MotherPhoneNumber:        in.MotherPhoneNumber,
		MotherJob:                in.MotherJob,
		IsMarried:                in.IsMarried,
		SpouseName:               in.SpouseName,
		SpouseDob:                in.SpouseDob,
		SpouseJob:                in.SpouseJob,
		SpousePhoneNumber:        in.SpousePhoneNumber,
		ChildrenInfos:            rawOrDefault(in.ChildrenInfos, "[]"),
		FamilySize:               in.FamilySize,
		FamilyBackground:         in.FamilyBackground,
		FamilyBirthOrder:         in.FamilyBirthOrder,
		Achievement:              in.Achievement,
		DisciplinaryHistory:      in.DisciplinaryHistory,
		Phone:                    in.Phone,
		ClassID:                  in.ClassID,
		UnitID:                   in.UnitID,
		Avatar:                   in.Avatar,
		Siblings:                 rawOrDefault(in.Siblings, "[]"),
		ContactPerson:            rawOrDefault(in.ContactPerson, "{}"),
		StudentID:                in.StudentID,
		RelatedDocumentations:    in.RelatedDocumentations,
		Status:                   status,
	}
}

// updatableColumns is every students column an UpdateStudents caller is
// allowed to touch (everything except pk/createdAt/updatedAt).
var updatableColumns = map[string]bool{
	"fullName": true, "birthPlace": true, "address": true, "dob": true,
	"rank": true, "previousUnit": true, "previousPosition": true, "position": true,
	"ethnic": true, "religion": true, "enlistmentPeriod": true, "politicalOrg": true,
	"politicalOrgOfficialDate": true, "cpvId": true, "educationLevel": true,
	"schoolName": true, "major": true, "isGraduated": true, "talent": true,
	"shortcoming": true, "policyBeneficiaryGroup": true, "fatherName": true,
	"fatherDob": true, "fatherPhoneNumber": true, "fatherJob": true, "motherName": true,
	"motherDob": true, "motherPhoneNumber": true, "motherJob": true, "isMarried": true,
	"spouseName": true, "spouseDob": true, "spouseJob": true, "spousePhoneNumber": true,
	"childrenInfos": true, "familySize": true, "familyBackground": true,
	"familyBirthOrder": true, "achievement": true, "disciplinaryHistory": true,
	"phone": true, "classId": true, "unitId": true, "cpvOfficialAt": true,
	"avatar": true, "siblings": true, "contactPerson": true, "studentId": true,
	"relatedDocumentations": true, "status": true,
}

// jsonColumns are stored as JSON text; a nested array/object value coming
// out of a JSON request body decodes to []any/map[string]any, neither of
// which the sqlite driver can bind directly, so it must be re-marshaled to
// the JSON text the column actually stores.
var jsonColumns = map[string]bool{
	"childrenInfos": true, "siblings": true, "contactPerson": true,
}

// toUpdateParams keeps only the recognized, non-nil columns from a partial
// update payload — analogous to apps/api's repo.ts filtering out `undefined`
// before issuing the SQL UPDATE.
func toUpdateParams(data map[string]any) (dbx.Params, error) {
	cols := dbx.Params{}
	for k, v := range data {
		if v == nil || !updatableColumns[k] {
			continue
		}

		if jsonColumns[k] {
			if s, ok := v.(string); ok {
				cols[k] = s
				continue
			}
			b, err := json.Marshal(v)
			if err != nil {
				return nil, fmt.Errorf("students: marshal %q: %w", k, err)
			}
			cols[k] = string(b)
			continue
		}

		cols[k] = v
	}
	return cols, nil
}
