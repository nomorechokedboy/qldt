-- Insert the rank_promotion_proposals resource. The create/read/update/
-- approve/reject actions already exist (seeded for transfer_requests in
-- 0010_seed-transfer-requests-authz.sql).
INSERT INTO resources (name, display_name, description) VALUES
('rank_promotion_proposals', 'Đề xuất thăng quân hàm', 'Quản lý đề xuất thăng quân hàm của quân nhân');
--> statement-breakpoint

-- Insert permissions for the rank_promotion_proposals resource (existing
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
WHERE r.name = 'rank_promotion_proposals'
  AND a.name IN ('create', 'read', 'update', 'approve', 'reject');
--> statement-breakpoint

-- Admin: full control over rank promotion proposals
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'rank_promotion_proposals';
--> statement-breakpoint

-- Battalion commander: full control over rank promotion proposals
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'battalion_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
WHERE r.name = 'rank_promotion_proposals';
--> statement-breakpoint

-- Company commander: read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'company_commander'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'rank_promotion_proposals'
  AND a.name = 'read';
--> statement-breakpoint

-- Viewer: read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'viewer'),
    p.id
FROM permissions p
INNER JOIN resources r ON p.resource_id = r.id
INNER JOIN actions a ON p.action_id = a.id
WHERE r.name = 'rank_promotion_proposals'
  AND a.name = 'read';
