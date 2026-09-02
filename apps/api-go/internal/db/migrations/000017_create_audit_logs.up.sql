CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`actorUserId` integer,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`resourceIds` text DEFAULT '[]',
	`method` text NOT NULL,
	`path` text NOT NULL,
	`statusCode` integer,
	`previousValue` text DEFAULT '{}',
	`newValue` text DEFAULT '{}',
	FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
