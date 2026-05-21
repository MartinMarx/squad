CREATE TABLE `notebooks` (
	`task_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notebooks_task_id` ON `notebooks` (`task_id`);