-- Grant positions permissions to existing roles. The positions resource and
-- its permissions (0012/0013) were added without a companion role_permissions
-- seed, unlike every other feature (see 0003/0005/0007/0010) - only
-- super_admin (auto-granted via trigger) could read/write positions.

-- Admin: full CRUD on positions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'positions';
--> statement-breakpoint

-- Battalion commander: full CRUD on positions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'positions';
--> statement-breakpoint

-- Company commander: full CRUD on positions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'positions';
--> statement-breakpoint

-- Viewer: read-only access to positions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'positions'
  AND a.name = 'read';
