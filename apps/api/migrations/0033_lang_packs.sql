CREATE TABLE `lang_packs` (
	`language` text PRIMARY KEY NOT NULL,
	`pack` text NOT NULL,
	`updated_by_user_id` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
