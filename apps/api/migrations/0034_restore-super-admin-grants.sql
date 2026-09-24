-- super_admin was missing every permission added after 0001 (only 32 of 82 in
-- existing databases): the assign_permission_to_super_admin trigger created in
-- 0001_seed-authz.sql is absent from migrated databases, so the later seed
-- migrations (0003-0030), which rely on it, never granted their permissions
-- to super_admin. Recreate the trigger and backfill the missing grants.
DROP TRIGGER IF EXISTS assign_permission_to_super_admin;
--> statement-breakpoint
CREATE TRIGGER assign_permission_to_super_admin
AFTER INSERT ON permissions
BEGIN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT
        (SELECT id FROM roles WHERE name = 'super_admin'),
        NEW.id
    WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin')
      AND NOT EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
          AND permission_id = NEW.id
      );
END;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
