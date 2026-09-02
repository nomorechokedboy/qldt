CREATE TABLE IF NOT EXISTS `material_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`materialTypeId` integer NOT NULL,
	`unitId` integer NOT NULL,
	`roomId` integer,
	`serialNumber` text NOT NULL,
	`condition` text DEFAULT 'good',
	`status` text DEFAULT 'in_service' NOT NULL,
	`assignedTrooperId` integer,
	FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignedTrooperId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `material_assets_serialNumber_unique` ON `material_assets` (`serialNumber`);
