-- New actions needed for the transfer-requests approval workflow
INSERT INTO actions (name, display_name, description) VALUES
('approve', 'Duyệt', 'Duyệt yêu cầu'),
('reject', 'Từ chối', 'Từ chối yêu cầu');
--> statement-breakpoint

-- Insert the transfer_requests resource
INSERT INTO resources (name, display_name, description) VALUES
('transfer_requests', 'Chuyển giao nguồn lực', 'Quản lý yêu cầu chuyển giao quân nhân, vũ khí, khí tài giữa các đơn vị');
--> statement-breakpoint

-- Insert permissions for the transfer_requests resource (existing
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
WHERE r.name = 'transfer_requests'
  AND a.name IN ('create', 'read', 'update', 'approve', 'reject');
--> statement-breakpoint

-- Admin: full control over transfer requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'transfer_requests';
--> statement-breakpoint

-- Battalion commander: can create, read, update (cancel), approve and
-- reject transfer requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'transfer_requests'
  AND a.name IN ('create', 'read', 'update', 'approve', 'reject');
--> statement-breakpoint

-- Company commander: can create, read, update (cancel), approve and
-- reject transfer requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'transfer_requests'
  AND a.name IN ('create', 'read', 'update', 'approve', 'reject');
--> statement-breakpoint

-- Viewer: read-only access to transfer requests
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'transfer_requests'
  AND a.name = 'read';
