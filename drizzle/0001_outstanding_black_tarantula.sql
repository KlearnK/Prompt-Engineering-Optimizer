CREATE TABLE `prompt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`originalPrompt` text NOT NULL,
	`optimizedPrompt` text,
	`assessmentResult` json,
	`appliedTechniques` json,
	`category` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompt_history_id` PRIMARY KEY(`id`)
);
