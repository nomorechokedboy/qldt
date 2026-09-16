-- 0016_seed-positions-authz.sql grants role_permissions for the `positions`
-- resource, but that resource and its four permissions were never actually
-- inserted anywhere: migration 0012 only creates the `positions` TABLE, and
-- 0013 only adds `students.positionId` - unlike every other feature
-- (0003/0005/0007/0010/0020/0025/0029), no migration ever ran the
-- `INSERT INTO resources` / `INSERT INTO permissions` pair for it. So
-- 0016's `INSERT INTO role_permissions ... WHERE r.name = 'positions'`
-- always matched zero rows and silently granted nothing on every database
-- migrated from scratch, leaving `positions:read` etc. nonexistent and
-- every non-super_admin role unable to read positions.
--
-- This migration inserts what 0016 assumed already existed, then re-runs
-- its role grants. Uses INSERT OR IGNORE throughout so it's also safe to
-- run against a database that already had these rows patched in by hand.

-- Insert the missing `positions` resource
INSERT OR IGNORE INTO resources (name, display_name, description) VALUES
('positions', 'Chức vụ', 'Quản lý danh mục chức vụ và thứ tự sắp xếp trong bảng trích ngang');
--> statement-breakpoint

-- Insert the missing `positions:*` permissions (existing
-- assign_permission_to_super_admin trigger auto-grants each of these to
-- super_admin as they're inserted)
INSERT OR IGNORE INTO permissions (resource_id, action_id, name, display_name, description)
SELECT
    r.id,
    a.id,
    r.name || ':' || a.name,
    a.display_name || ' - ' || r.display_name,
    'Quyền để ' || LOWER(a.display_name) || ' ' || LOWER(r.display_name)
FROM resources r
CROSS JOIN actions a
WHERE r.name = 'positions'
  AND a.name IN ('create', 'read', 'update', 'delete');
--> statement-breakpoint

-- Re-run 0016's grants now that the resource/permissions actually exist

-- Admin: full CRUD on positions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'positions';
--> statement-breakpoint

-- Battalion commander: full CRUD on positions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'positions';
--> statement-breakpoint

-- Company commander: full CRUD on positions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'positions';
--> statement-breakpoint

-- Viewer: read-only access to positions
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'positions'
  AND a.name = 'read';
