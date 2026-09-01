ALTER TABLE `units` ADD `commanderId` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `units` ADD `deputyCommanderId` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `units` ADD `politicalCommanderId` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `units` ADD `deputyPoliticalCommanderId` integer REFERENCES users(id);