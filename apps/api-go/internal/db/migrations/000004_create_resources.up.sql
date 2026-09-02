CREATE TABLE IF NOT EXISTS `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `resources_name_unique` ON `resources` (`name`);
