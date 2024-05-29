CREATE TABLE `name_to_route` (
	`name` text PRIMARY KEY NOT NULL,
	`route` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`category` text,
	`description` text,
	`image_url` text
);
