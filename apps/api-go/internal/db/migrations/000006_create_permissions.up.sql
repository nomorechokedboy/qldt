CREATE TABLE IF NOT EXISTS `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`resource_id` integer NOT NULL,
	`action_id` integer NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `permissions_name_unique` ON `permissions` (`name`);
