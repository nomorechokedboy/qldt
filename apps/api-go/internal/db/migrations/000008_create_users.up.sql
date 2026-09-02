CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`displayName` text DEFAULT '' NOT NULL,
	`isSuperUser` integer DEFAULT false NOT NULL,
	`unitId` integer,
	`status` text DEFAULT 'pending',
	`rank` text,
	`position` text,
	`alias` text,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);
