-- Insert resource for the export template management feature
INSERT INTO resources (name, display_name, description) VALUES
('export_templates', 'Mẫu xuất dữ liệu', 'Quản lý mẫu docx dùng để xuất dữ liệu');
--> statement-breakpoint

-- Insert permissions for the new resource (existing assign_permission_to_super_admin
-- trigger auto-grants each of these to super_admin as they're inserted)
INSERT INTO permissions (resource_id, action_id, name, display_name, description)
SELECT
    r.id,
    a.id,
    r.name || ':' || a.name,
    a.display_name || ' - ' || r.display_name,
    'Quyền để ' || LOWER(a.display_name) || ' ' || LOWER(r.display_name)
FROM resources r
CROSS JOIN actions a
WHERE r.name = 'export_templates';
--> statement-breakpoint

-- Admin: full CRUD on export templates
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'export_templates';
--> statement-breakpoint

-- Battalion commander: full CRUD on export templates
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'export_templates';
--> statement-breakpoint

-- Company commander: full CRUD on export templates
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'export_templates';
--> statement-breakpoint

-- Viewer: read-only access to export templates
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'export_templates'
  AND a.name = 'read';
