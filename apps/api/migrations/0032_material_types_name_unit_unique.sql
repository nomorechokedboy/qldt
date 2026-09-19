DROP INDEX `material_types_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `material_types_name_unitOfMeasure_unique` ON `material_types` (`name`,`unitOfMeasure`);