CREATE TABLE IF NOT EXISTS `units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	`alias` text NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`parentId` integer,
	-- commanderId/deputyCommanderId/politicalCommanderId/deputyPoliticalCommanderId
	-- reference users(id) in apps/api, but the users table doesn't exist yet
	-- in this phase (Phase 2) — SQLite validates a column-level REFERENCES
	-- target exists even for NULL values when foreign_keys=on, so the FK
	-- constraint is deferred until users lands.
	`commanderId` integer,
	`deputyCommanderId` integer,
	`politicalCommanderId` integer,
	`deputyPoliticalCommanderId` integer,
	FOREIGN KEY (`parentId`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `units_alias_unique` ON `units` (`alias`);
CREATE UNIQUE INDEX IF NOT EXISTS `units_name_unique` ON `units` (`name`);
