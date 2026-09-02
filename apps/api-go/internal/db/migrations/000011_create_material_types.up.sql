CREATE TABLE IF NOT EXISTS `material_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unitOfMeasure` text DEFAULT 'cái',
	`isSerialized` integer DEFAULT false NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `material_types_name_unique` ON `material_types` (`name`);
