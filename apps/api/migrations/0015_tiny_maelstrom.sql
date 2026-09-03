DROP INDEX `units_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `units_name_parent_unique` ON `units` (`name`,`parentId`);