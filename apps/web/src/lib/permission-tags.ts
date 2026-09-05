/**
 * Permission tags for RBAC.
 * Format: "<resource>:<action>" — mirrors the values used in
 * apps/api/middleware/authz.ts's PERMISSION_MAP and the `permissions`
 * claim returned from GET /authn/me.
 */
export const PermissionTag = {
	STUDENTS_CREATE: 'students:create',
	STUDENTS_READ: 'students:read',
	STUDENTS_UPDATE: 'students:update',
	STUDENTS_DELETE: 'students:delete',

	USERS_CREATE: 'users:create',
	USERS_READ: 'users:read',
	USERS_UPDATE: 'users:update',
	USERS_DELETE: 'users:delete',

	UNITS_CREATE: 'units:create',
	UNITS_READ: 'units:read',
	UNITS_UPDATE: 'units:update',
	UNITS_DELETE: 'units:delete',

	ROLES_CREATE: 'roles:create',
	ROLES_READ: 'roles:read',
	ROLES_UPDATE: 'roles:update',
	ROLES_DELETE: 'roles:delete',

	RESOURCES_READ: 'resources:read',
	ACTIONS_READ: 'actions:read',
	AUDIT_LOGS_READ: 'audit_logs:read',

	BUILDINGS_CREATE: 'buildings:create',
	BUILDINGS_READ: 'buildings:read',
	BUILDINGS_UPDATE: 'buildings:update',
	BUILDINGS_DELETE: 'buildings:delete',

	ROOMS_CREATE: 'rooms:create',
	ROOMS_READ: 'rooms:read',
	ROOMS_UPDATE: 'rooms:update',
	ROOMS_DELETE: 'rooms:delete',

	MATERIAL_TYPES_CREATE: 'material_types:create',
	MATERIAL_TYPES_READ: 'material_types:read',
	MATERIAL_TYPES_UPDATE: 'material_types:update',
	MATERIAL_TYPES_DELETE: 'material_types:delete',

	MATERIAL_ASSETS_CREATE: 'material_assets:create',
	MATERIAL_ASSETS_READ: 'material_assets:read',
	MATERIAL_ASSETS_UPDATE: 'material_assets:update',
	MATERIAL_ASSETS_DELETE: 'material_assets:delete',

	MATERIAL_STOCKS_CREATE: 'material_stocks:create',
	MATERIAL_STOCKS_READ: 'material_stocks:read',
	MATERIAL_STOCKS_UPDATE: 'material_stocks:update',
	MATERIAL_STOCKS_DELETE: 'material_stocks:delete',

	EXPORT_TEMPLATES_CREATE: 'export_templates:create',
	EXPORT_TEMPLATES_READ: 'export_templates:read',
	EXPORT_TEMPLATES_DELETE: 'export_templates:delete'
} as const

export type PermissionTagValue =
	(typeof PermissionTag)[keyof typeof PermissionTag]
