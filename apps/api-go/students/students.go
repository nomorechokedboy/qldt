// Package students exposes bare CRUD endpoints over the students table.
// It intentionally skips apps/api's authz/audit middleware, classId/unitId
// ownership checks, docx/xlsx export, and notifications — see
// apps/api-go/README.md for what's deferred and why.
package students

import (
	"context"
	"encoding/json"
	"fmt"

	"encore.app/config"
	"encore.app/internal/apperr"
	"encore.app/internal/auditctx"
	"encore.app/internal/db"
	"encore.app/internal/entities"
	"encore.app/internal/students"
)

var repo *students.Repository

func init() {
	cfg := config.Get()

	conn, err := db.New(cfg.DatabaseURI)
	if err != nil {
		panic(fmt.Errorf("students: open db: %w", err))
	}

	if err := db.RunMigrations(conn); err != nil {
		panic(fmt.Errorf("students: run migrations: %w", err))
	}

	repo = students.NewRepository(conn)
}

type CreateStudentsRequest struct {
	Data []CreateStudentInput `json:"data"`
}

type StudentsResponse struct {
	Data []*entities.Student `json:"data"`
}

// CreateStudents inserts one or more students.
//
//encore:api auth method=POST path=/students tag:audited
func CreateStudents(ctx context.Context, req *CreateStudentsRequest) (*StudentsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one student"))
	}

	rows := make([]*entities.Student, len(req.Data))
	for i, in := range req.Data {
		if in.PoliticalOrg != string(entities.PoliticalOrgHCYU) && in.PoliticalOrg != string(entities.PoliticalOrgCPV) {
			return nil, apperr.Wrap(apperr.InvalidArgument("politicalOrg can be only hcyu or cpv"))
		}
		rows[i] = in.toEntity()
	}

	if err := repo.Create(ctx, rows); err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &StudentsResponse{Data: rows}, nil
}

type GetStudentsRequest struct {
	Ids []int64 `query:"ids"`
}

// GetStudents lists students, optionally filtered by id.
//
//encore:api auth method=GET path=/students
func GetStudents(ctx context.Context, req *GetStudentsRequest) (*StudentsResponse, error) {
	rows, err := repo.Find(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	return &StudentsResponse{Data: rows}, nil
}

type GetStudentResponse struct {
	Data *entities.Student `json:"data"`
}

// GetStudent returns a single student by id.
//
//encore:api auth method=GET path=/students/:id
func GetStudent(ctx context.Context, id int64) (*GetStudentResponse, error) {
	row, err := repo.FindOne(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(apperr.NotFound("student %d not found", id))
	}

	return &GetStudentResponse{Data: row}, nil
}

type UpdateStudentInput struct {
	ID int64 `json:"id"`
	// Data is a JSON object with any subset of the students columns; kept
	// as raw JSON (rather than map[string]any) because Encore's API schema
	// doesn't support interface-typed fields.
	Data json.RawMessage `json:"data"`
}

type UpdateStudentsRequest struct {
	Data []UpdateStudentInput `json:"data"`
}

// UpdateStudents applies a partial update to one or more students. Each
// entry's `data` may contain any subset of the students columns.
//
//encore:api auth method=PATCH path=/students tag:audited
func UpdateStudents(ctx context.Context, req *UpdateStudentsRequest) (*StudentsResponse, error) {
	if len(req.Data) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("data must contain at least one update"))
	}

	rows := make([]*entities.Student, len(req.Data))
	for i, u := range req.Data {
		var data map[string]any
		if err := json.Unmarshal(u.Data, &data); err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("invalid update data for student id %d: %v", u.ID, err))
		}

		cols, err := toUpdateParams(data)
		if err != nil {
			return nil, apperr.Wrap(apperr.InvalidArgument("%v", err))
		}
		if len(cols) == 0 {
			return nil, apperr.Wrap(apperr.InvalidArgument("no update data provided for student id %d", u.ID))
		}

		row, err := repo.Update(ctx, u.ID, cols)
		if err != nil {
			return nil, apperr.Wrap(err)
		}
		rows[i] = row
	}

	ids := make([]any, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	auditctx.SetContext(ctx, ids, nil, rows)

	return &StudentsResponse{Data: rows}, nil
}

type DeleteStudentsRequest struct {
	// Encore requires GET/DELETE parameters in the query string, not a JSON
	// body — matches apps/api's `DELETE /students?ids=1&ids=2` shape.
	Ids []int64 `query:"ids"`
}

type DeleteStudentsResponse struct {
	Ids []int64 `json:"ids"`
}

// DeleteStudents removes one or more students by id.
//
//encore:api auth method=DELETE path=/students tag:audited
func DeleteStudents(ctx context.Context, req *DeleteStudentsRequest) (*DeleteStudentsResponse, error) {
	if len(req.Ids) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("ids must contain at least one id"))
	}

	deleted, err := repo.Delete(ctx, req.Ids)
	if err != nil {
		return nil, apperr.Wrap(err)
	}

	ids := make([]any, len(req.Ids))
	for i, id := range req.Ids {
		ids[i] = id
	}
	auditctx.SetContext(ctx, ids, deleted, nil)

	return &DeleteStudentsResponse{Ids: req.Ids}, nil
}

type UpdateStudentStatusRequest struct {
	StudentIds []int64 `json:"studentIds"`
	Status     string  `json:"status"`
}

type UpdateStudentStatusResponse struct {
	IsSuccess bool `json:"isSuccess"`
}

// UpdateStudentStatus bulk-updates the status of one or more students.
//
//encore:api auth method=PUT path=/students/change-status
func UpdateStudentStatus(ctx context.Context, req *UpdateStudentStatusRequest) (*UpdateStudentStatusResponse, error) {
	status := entities.Status(req.Status)
	if status != entities.StatusPending && status != entities.StatusConfirmed {
		return nil, apperr.Wrap(apperr.InvalidArgument("status must be pending or confirmed"))
	}

	if len(req.StudentIds) == 0 {
		return nil, apperr.Wrap(apperr.InvalidArgument("studentIds must contain at least one id"))
	}

	if _, err := repo.UpdateStatus(ctx, req.StudentIds, status); err != nil {
		return nil, apperr.Wrap(err)
	}

	return &UpdateStudentStatusResponse{IsSuccess: true}, nil
}
