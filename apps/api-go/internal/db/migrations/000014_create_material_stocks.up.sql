CREATE TABLE IF NOT EXISTS `material_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`materialTypeId` integer NOT NULL,
	`unitId` integer NOT NULL,
	`roomId` integer,
	`quantity` integer DEFAULT 0 NOT NULL,
	`condition` text DEFAULT 'good',
	FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `material_stock_unique_constraint` ON `material_stocks` (`materialTypeId`,`unitId`,`roomId`,`condition`);
