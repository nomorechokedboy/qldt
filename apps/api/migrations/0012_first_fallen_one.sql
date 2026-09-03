CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`level` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`priority` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `positions_level_code_unique` ON `positions` (`level`,`code`);