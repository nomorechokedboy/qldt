-- Insert resources for the materials management feature
INSERT INTO resources (name, display_name, description) VALUES
('buildings', 'Nhà/khu nhà', 'Quản lý nhà/khu nhà của đơn vị'),
('rooms', 'Phòng', 'Quản lý phòng trong nhà/khu nhà của đơn vị'),
('material_types', 'Danh mục vật tư', 'Quản lý danh mục loại vật tư/trang bị'),
('material_stocks', 'Vật tư sinh hoạt', 'Quản lý số lượng vật tư sinh hoạt theo đơn vị/phòng'),
('material_assets', 'Vũ khí/trang bị', 'Quản lý vũ khí/trang bị được theo dõi theo số seri');
--> statement-breakpoint

-- Insert permissions for the new resources (existing assign_permission_to_super_admin
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
WHERE r.name IN ('buildings', 'rooms', 'material_types', 'material_stocks', 'material_assets');
--> statement-breakpoint

-- Admin: full CRUD on all materials management resources
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name IN ('buildings', 'rooms', 'material_types', 'material_stocks', 'material_assets');
--> statement-breakpoint

-- Battalion commander: full CRUD on all materials management resources
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name IN ('buildings', 'rooms', 'material_types', 'material_stocks', 'material_assets');
--> statement-breakpoint

-- Company commander: full CRUD on all materials management resources
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name IN ('buildings', 'rooms', 'material_types', 'material_stocks', 'material_assets');
--> statement-breakpoint

-- Viewer: read-only access to materials management resources
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name IN ('buildings', 'rooms', 'material_types', 'material_stocks', 'material_assets')
  AND a.name = 'read';
