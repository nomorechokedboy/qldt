CREATE TABLE IF NOT EXISTS `buildings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`unitId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
