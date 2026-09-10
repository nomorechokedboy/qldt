CREATE TABLE `inventory_session_expected_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`sessionId` integer NOT NULL,
	`materialTypeId` integer NOT NULL,
	`condition` text NOT NULL,
	`expectedQuantity` integer NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `inventory_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_session_expected_stocks_session_id_idx` ON `inventory_session_expected_stocks` (`sessionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_session_expected_stocks_session_type_condition_unique` ON `inventory_session_expected_stocks` (`sessionId`,`materialTypeId`,`condition`);--> statement-breakpoint
CREATE TABLE `inventory_session_stock_counts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`sessionId` integer NOT NULL,
	`materialTypeId` integer NOT NULL,
	`condition` text NOT NULL,
	`observedQuantity` integer NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `inventory_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `inventory_session_stock_counts_session_id_idx` ON `inventory_session_stock_counts` (`sessionId`);