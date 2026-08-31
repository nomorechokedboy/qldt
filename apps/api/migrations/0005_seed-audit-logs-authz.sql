-- Insert the audit_logs resource
INSERT INTO resources (name, display_name, description) VALUES
('audit_logs', 'Nhật ký hoạt động', 'Xem nhật ký thao tác của người dùng trên hệ thống');
--> statement-breakpoint

-- Insert permissions for the audit_logs resource (existing
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
WHERE r.name = 'audit_logs';
--> statement-breakpoint

-- Admin and battalion commander: can read the audit log
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'audit_logs'
  AND a.name = 'read';
--> statement-breakpoint

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'audit_logs'
  AND a.name = 'read';
