CREATE TABLE `user_behavior_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`payload` json,
	`scoreDelta` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_behavior_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_dimension_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dimensionId` varchar(32) NOT NULL,
	`weight` float NOT NULL DEFAULT 1,
	`sampleCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_dimension_weights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryType` varchar(32) NOT NULL DEFAULT 'custom_rule',
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_technique_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`techniqueId` varchar(64) NOT NULL,
	`timesRecommended` int NOT NULL DEFAULT 0,
	`timesAdopted` int NOT NULL DEFAULT 0,
	`timesRejected` int NOT NULL DEFAULT 0,
	`avgScoreDelta` float NOT NULL DEFAULT 0,
	`isFavorited` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_technique_stats_id` PRIMARY KEY(`id`)
);
