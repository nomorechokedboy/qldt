CREATE TABLE IF NOT EXISTS `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`description` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `roles_name_unique` ON `roles` (`name`);
