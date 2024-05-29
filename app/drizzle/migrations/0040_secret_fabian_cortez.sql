CREATE TABLE `signups` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`category` text,
	`description` text,
	`image_url` text,
	`insta` text
);
