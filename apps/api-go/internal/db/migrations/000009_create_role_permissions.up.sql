CREATE TABLE IF NOT EXISTS `role_permissions` (
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
