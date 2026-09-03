DROP INDEX `units_alias_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `units_alias_id_unique` ON `units` (`alias`,`id`);