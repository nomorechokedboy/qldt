CREATE TABLE `inventory_session_expected_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`sessionId` integer NOT NULL,
	`assetId` integer NOT NULL,
	`serialNumber` text NOT NULL,
	`conditionSnapshot` text NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `inventory_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assetId`) REFERENCES `material_assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_session_expected_assets_session_id_idx` ON `inventory_session_expected_assets` (`sessionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_session_expected_assets_session_asset_unique` ON `inventory_session_expected_assets` (`sessionId`,`assetId`);--> statement-breakpoint
CREATE TABLE `inventory_session_scans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`sessionId` integer NOT NULL,
	`serialNumber` text NOT NULL,
	`assetId` integer,
	`observedCondition` text,
	`scannedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `inventory_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assetId`) REFERENCES `material_assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_session_scans_session_id_idx` ON `inventory_session_scans` (`sessionId`);--> statement-breakpoint
CREATE INDEX `inventory_session_scans_serial_number_idx` ON `inventory_session_scans` (`serialNumber`);--> statement-breakpoint
CREATE INDEX `inventory_session_scans_asset_id_idx` ON `inventory_session_scans` (`assetId`);--> statement-breakpoint
CREATE TABLE `inventory_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`roomId` integer NOT NULL,
	`unitId` integer NOT NULL,
	`startedByUserId` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`completedAt` text,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`startedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_sessions_room_id_idx` ON `inventory_sessions` (`roomId`);--> statement-breakpoint
CREATE INDEX `inventory_sessions_unit_id_idx` ON `inventory_sessions` (`unitId`);--> statement-breakpoint
CREATE INDEX `inventory_sessions_started_by_user_id_idx` ON `inventory_sessions` (`startedByUserId`);