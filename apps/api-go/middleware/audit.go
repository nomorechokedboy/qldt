// Package middleware holds cross-cutting Encore middleware, mirroring
// apps/api/middleware/. It is not itself an Encore service — global
// middleware just needs to live somewhere in the app for Encore's static
// analyzer to find the //encore:middleware directive.
package middleware

import (
	"encoding/json"
	"regexp"
	"strings"

	"encore.app/authn"
	"encore.app/internal/auditctx"
	"encore.app/internal/entities"
	"encore.app/internal/logger"
	"encore.app/internal/topics"
	"encore.dev/beta/auth"
	"encore.dev/middleware"
)

// auditRoutes maps a route pattern (":param" segments are wildcards) to the
// resource name written to audit_logs.resource. Mirrors apps/api/middleware/
// audit.ts's AUDIT_MAP, adapted to this app's actual Go routes (PATCH
// instead of PUT for bulk updates, no path params on most bulk endpoints).
var auditRoutes = map[string]string{
	"/units":                         "units",
	"/classes":                       "classes",
	"/buildings":                     "buildings",
	"/rooms":                         "rooms",
	"/material-types":                "material_types",
	"/material-stocks":               "material_stocks",
	"/material-assets":               "material_assets",
	"/students":                      "students",
	"/roles":                         "roles",
	"/permissions":                   "permissions",
	"/users":                         "users",
	"/roles/:roleId/permissions":     "role_permissions",
	"/users/:userId/roles":           "user_roles",
	"/export-templates":              "export_templates",
	"/export-templates/:id":          "export_templates",
	"/transfer-requests":             "transfer_requests",
	"/transfer-requests/:id/approve": "transfer_requests",
	"/transfer-requests/:id/reject":  "transfer_requests",
	"/transfer-requests/:id/cancel":  "transfer_requests",
}

// routeActionOverrides pins the audit action for routes where the generic
// method-based rule in auditAction (POST=create, DELETE=delete, else
// update) would be wrong — mirrors apps/api/middleware/audit.ts's AUDIT_MAP,
// whose entries for /transfer-requests/:id/approve and .../reject use the
// dedicated approve/reject actions, and .../cancel logs as an update since
// it doesn't destroy the request row.
var routeActionOverrides = map[string]entities.AuditAction{
	"/transfer-requests/:id/approve": entities.AuditActionApprove,
	"/transfer-requests/:id/reject":  entities.AuditActionReject,
	"/transfer-requests/:id/cancel":  entities.AuditActionUpdate,
}

// joinTableResources are assign/remove endpoints where every mutating
// method (POST assign, DELETE remove) is logged as an "update" rather than
// distinguishing create/delete, since neither call destroys the underlying
// role/user/permission row — only the association.
var joinTableResources = map[string]bool{
	"role_permissions": true,
	"user_roles":       true,
}

var paramSegment = regexp.MustCompile(`^:\w+$`)

func matchAuditRoute(path string) (resource, pattern string, ok bool) {
	if r, ok := auditRoutes[path]; ok {
		return r, path, true
	}

	reqSegs := strings.Split(strings.Trim(path, "/"), "/")
	for pat, resource := range auditRoutes {
		patSegs := strings.Split(strings.Trim(pat, "/"), "/")
		if len(patSegs) != len(reqSegs) {
			continue
		}
		match := true
		for i, seg := range patSegs {
			if paramSegment.MatchString(seg) {
				continue
			}
			if seg != reqSegs[i] {
				match = false
				break
			}
		}
		if match {
			return resource, pat, true
		}
	}

	return "", "", false
}

func auditAction(method, resource, pattern string) entities.AuditAction {
	if override, ok := routeActionOverrides[pattern]; ok {
		return override
	}
	if joinTableResources[resource] {
		return entities.AuditActionUpdate
	}
	switch method {
	case "POST":
		return entities.AuditActionCreate
	case "DELETE":
		return entities.AuditActionDelete
	default:
		return entities.AuditActionUpdate
	}
}

// sensitiveKeys are stripped from previousValue/newValue before they're
// persisted, regardless of what a handler passed to auditctx.SetContext —
// this is the one place every call site funnels through, matching
// apps/api/middleware/audit.ts's sanitizeAuditValue.
var sensitiveKeys = map[string]bool{"password": true}

func sanitizeAuditValue(v any) any {
	switch val := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(val))
		for k, vv := range val {
			if sensitiveKeys[k] {
				continue
			}
			out[k] = sanitizeAuditValue(vv)
		}
		return out
	case []any:
		out := make([]any, len(val))
		for i, vv := range val {
			out[i] = sanitizeAuditValue(vv)
		}
		return out
	default:
		return v
	}
}

// jsonOrDefault marshals v, falling back to def when v is nil/empty so an
// unset audit field still round-trips as valid JSON, matching how
// apps/api/schema/audit-logs.ts defaults resourceIds/previousValue/newValue.
func jsonOrDefault(v any, def string) entities.JSONText {
	if v == nil {
		return entities.JSONText(def)
	}
	b, err := json.Marshal(v)
	if err != nil || string(b) == "null" {
		return entities.JSONText(def)
	}
	return entities.JSONText(b)
}

//encore:middleware global target=tag:audited
func Audit(req middleware.Request, next middleware.Next) middleware.Response {
	data := req.Data()
	resource, pattern, ok := matchAuditRoute(data.Path)
	if !ok {
		return next(req)
	}

	ctx, auditData := auditctx.WithData(req.Context())
	resp := next(req.WithContext(ctx))

	if resp.Err != nil || !auditData.Set {
		return resp
	}

	var actorUserID *int64
	if authData, ok := auth.Data().(*authn.AuthData); ok && authData != nil {
		id := authData.UserID
		actorUserID = &id
	}

	statusCode := resp.HTTPStatus
	if statusCode == 0 {
		statusCode = 200
	}

	_, err := topics.AuditLogTopic.Publish(req.Context(), &topics.AuditLogEvent{
		ActorUserID:   actorUserID,
		Resource:      resource,
		Action:        string(auditAction(data.Method, resource, pattern)),
		ResourceIds:   jsonOrDefault(auditData.ResourceIds, "[]"),
		Method:        data.Method,
		Path:          data.Path,
		StatusCode:    &statusCode,
		PreviousValue: jsonOrDefault(sanitizeAuditValue(auditData.PreviousValue), "{}"),
		NewValue:      jsonOrDefault(sanitizeAuditValue(auditData.NewValue), "{}"),
	})
	if err != nil {
		logger.ErrorContext(req.Context(), "audit middleware: failed to publish audit log event", "err", err)
	}

	return resp
}
