-- Insert the inventory_sessions resource - covers opening a room's QR
-- reconciliation challenge, importing the phone's signed results, and
-- reviewing/closing out the diff. No 'delete' action: sessions are never
-- deleted, only progressed through in_progress -> completed -> reviewed.
INSERT INTO resources (name, display_name, description) VALUES
('inventory_sessions', 'Kiểm kê bằng mã QR', 'Quản lý phiên kiểm kê đối chiếu vũ khí/trang bị bằng mã QR');
--> statement-breakpoint

-- Insert permissions for the new resource (existing
-- assign_permission_to_super_admin trigger auto-grants these to super_admin)
INSERT INTO permissions (resource_id, action_id, name, display_name, description)
SELECT
    r.id,
    a.id,
    r.name || ':' || a.name,
    a.display_name || ' - ' || r.display_name,
    'Quyền để ' || LOWER(a.display_name) || ' ' || LOWER(r.display_name)
FROM resources r
CROSS JOIN actions a
WHERE r.name = 'inventory_sessions'
  AND a.name IN ('create', 'read', 'update');
--> statement-breakpoint

-- Admin: full access - open sessions, submit results, mark reviewed
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'inventory_sessions';
--> statement-breakpoint

-- Battalion commander: same as material_assets - runs reconciliation for
-- rooms in their chain of command
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'inventory_sessions';
--> statement-breakpoint

-- Company commander: same as material_assets - runs reconciliation for
-- rooms in their company
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'inventory_sessions';
--> statement-breakpoint

-- Viewer: read-only - can see a session's review/diff, not open or submit one
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'inventory_sessions'
  AND a.name = 'read';
