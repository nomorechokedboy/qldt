CREATE TABLE IF NOT EXISTS `material_asset_events` (
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
