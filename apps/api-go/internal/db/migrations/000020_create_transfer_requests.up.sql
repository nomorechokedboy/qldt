CREATE TABLE IF NOT EXISTS `transfer_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`sourceUnitId` integer NOT NULL,
	`destinationUnitId` integer NOT NULL,
	`destinationRoomId` integer,
	`requestedByUserId` integer NOT NULL,
	`approverUserId` integer NOT NULL,
	`decidedByUserId` integer,
	`decidedAt` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejectionReason` text,
	FOREIGN KEY (`sourceUnitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destinationUnitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destinationRoomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approverUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `transfer_request_troopers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`transferRequestId` integer NOT NULL,
	`studentId` integer NOT NULL,
	`itemStatus` text DEFAULT 'pending' NOT NULL,
	`failureReason` text,
	FOREIGN KEY (`transferRequestId`) REFERENCES `transfer_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `transfer_request_material_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`transferRequestId` integer NOT NULL,
	`materialAssetId` integer NOT NULL,
	`itemStatus` text DEFAULT 'pending' NOT NULL,
	`failureReason` text,
	FOREIGN KEY (`transferRequestId`) REFERENCES `transfer_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`materialAssetId`) REFERENCES `material_assets`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `transfer_request_material_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`transferRequestId` integer NOT NULL,
	`materialTypeId` integer NOT NULL,
	`condition` text NOT NULL,
	`quantity` integer NOT NULL,
	`itemStatus` text DEFAULT 'pending' NOT NULL,
	`failureReason` text,
	FOREIGN KEY (`transferRequestId`) REFERENCES `transfer_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`materialTypeId`) REFERENCES `material_types`(`id`) ON UPDATE no action ON DELETE no action
);
