CREATE TABLE `buildings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`unitId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `material_asset_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`assetId` integer NOT NULL,
	`eventType` text NOT NULL,
	`previousValue` text DEFAULT '{}',
	`newValue` text DEFAULT '{}',
	`note` text,
	`actorUserId` integer,
	FOREIGN KEY (`assetId`) REFERENCES `material_assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `material_assets` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `material_assets_serialNumber_unique` ON `material_assets` (`serialNumber`);--> statement-breakpoint
CREATE TABLE `material_stocks` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `material_stock_unique_constraint` ON `material_stocks` (`materialTypeId`,`unitId`,`roomId`,`condition`);--> statement-breakpoint
CREATE TABLE `material_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unitOfMeasure` text DEFAULT 'cái',
	`isSerialized` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `material_types_name_unique` ON `material_types` (`name`);--> statement-breakpoint
CREATE TABLE `rooms` (
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
