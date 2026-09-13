CREATE TABLE `activity_status_proposal_troopers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`proposalId` integer NOT NULL,
	`studentId` integer NOT NULL,
	`itemStatus` text DEFAULT 'pending' NOT NULL,
	`failureReason` text,
	FOREIGN KEY (`proposalId`) REFERENCES `activity_status_proposals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `activity_status_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`unitId` integer NOT NULL,
	`requestedByUserId` integer NOT NULL,
	`approverUserId` integer NOT NULL,
	`decidedByUserId` integer,
	`decidedAt` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`targetActivityStatus` text NOT NULL,
	`rejectionReason` text,
	`note` text,
	FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approverUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
