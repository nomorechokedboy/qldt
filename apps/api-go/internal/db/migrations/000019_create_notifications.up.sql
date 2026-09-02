CREATE TABLE IF NOT EXISTS `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`readAt` text,
	`notificationType` text DEFAULT 'birthday' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`isBatch` integer DEFAULT false,
	`batchKey` text,
	`totalCount` integer DEFAULT 1,
	`recipientId` integer,
	`actorId` integer,
	FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `recipient_idx` ON `notifications` (`recipientId`);
CREATE INDEX IF NOT EXISTS `batch_idx` ON `notifications` (`batchKey`);

CREATE TABLE IF NOT EXISTS `notification_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`notifiableType` text NOT NULL,
	`notifiableId` integer NOT NULL,
	`notificationId` text NOT NULL,
	FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX IF NOT EXISTS `notification_items_notification_idx` ON `notification_items` (`notificationId`);
CREATE INDEX IF NOT EXISTS `notification_items_item_idx` ON `notification_items` (`notifiableType`,`notifiableId`);
