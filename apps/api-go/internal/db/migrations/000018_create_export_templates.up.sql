CREATE TABLE IF NOT EXISTS `export_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`resource_type` text NOT NULL,
	`s3_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`uploaded_by_user_id` integer
);
