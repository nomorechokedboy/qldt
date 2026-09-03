DROP INDEX `units_alias_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `units_alias_parent_unique` ON `units` (`alias`,`parentId`);