CREATE TABLE IF NOT EXISTS `user_roles` (
	`user_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
