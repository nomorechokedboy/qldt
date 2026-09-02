CREATE TABLE IF NOT EXISTS `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`unitId` integer NOT NULL,
	`buildingId` integer,
	`name` text NOT NULL,
	`type` text,
	`description` text,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buildingId`) REFERENCES `buildings`(`id`) ON UPDATE no action ON DELETE no action
);
