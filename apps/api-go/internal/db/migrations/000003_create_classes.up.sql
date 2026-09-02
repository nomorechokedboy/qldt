CREATE TABLE IF NOT EXISTS `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`description` text DEFAULT '',
	`graduatedAt` text,
	`status` text DEFAULT 'ongoing',
	`unitId` integer NOT NULL,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `class_unit_unique_constraint` ON `classes` (`name`,`unitId`);
