import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Prompt history table
export const promptHistory = mysqlTable("prompt_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  originalPrompt: text("originalPrompt").notNull(),
  optimizedPrompt: text("optimizedPrompt"),
  assessmentResult: json("assessmentResult"),
  appliedTechniques: json("appliedTechniques"),
  category: varchar("category", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PromptHistory = typeof promptHistory.$inferSelect;
export type InsertPromptHistory = typeof promptHistory.$inferInsert;

// ─── Continuous Learning Tables ───────────────────────────────────────────────

/**
 * User behavior events — every meaningful interaction is recorded here.
 * This is the raw data that drives all learning.
 */
export const userBehaviorEvents = mysqlTable("user_behavior_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Event types:
  //   technique_adopted   – user clicked "apply" on a technique suggestion
  //   technique_rejected  – user dismissed a technique suggestion
  //   optimization_accepted – user copied/kept the optimized prompt
  //   optimization_rejected – user discarded the optimized prompt
  //   dimension_feedback  – user manually adjusted a dimension score
  //   template_used       – user applied a template
  //   prompt_saved        – user saved a prompt to history
  eventType: varchar("eventType", { length: 64 }).notNull(),
  // Flexible payload: techniqueId, dimensionId, score, category, etc.
  payload: json("payload"),
  // Score improvement delta (optimized - original overall score), nullable
  scoreDelta: float("scoreDelta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserBehaviorEvent = typeof userBehaviorEvents.$inferSelect;
export type InsertUserBehaviorEvent = typeof userBehaviorEvents.$inferInsert;

/**
 * Per-user dimension weight preferences.
 * Starts at default (equal weights), then drifts based on behavior.
 * One row per user per dimension.
 */
export const userDimensionWeights = mysqlTable("user_dimension_weights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Dimension IDs: clarity, specificity, structure, completeness, tone, constraints
  dimensionId: varchar("dimensionId", { length: 32 }).notNull(),
  // Weight 0.0–2.0, default 1.0
  weight: float("weight").notNull().default(1.0),
  // How many times this dimension influenced a decision
  sampleCount: int("sampleCount").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserDimensionWeight = typeof userDimensionWeights.$inferSelect;

/**
 * Personal technique effectiveness — tracks which techniques actually helped.
 * One row per user per technique.
 */
export const userTechniqueStats = mysqlTable("user_technique_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  techniqueId: varchar("techniqueId", { length: 64 }).notNull(),
  timesRecommended: int("timesRecommended").notNull().default(0),
  timesAdopted: int("timesAdopted").notNull().default(0),
  timesRejected: int("timesRejected").notNull().default(0),
  // Average score improvement when this technique was applied
  avgScoreDelta: float("avgScoreDelta").notNull().default(0),
  isFavorited: boolean("isFavorited").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserTechniqueStats = typeof userTechniqueStats.$inferSelect;

/**
 * Personal knowledge base — user-curated rules, notes, and custom guidelines.
 * These are injected into the LLM system prompt during evaluation/optimization.
 */
export const userKnowledgeBase = mysqlTable("user_knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Entry types: custom_rule, personal_note, learned_pattern
  entryType: varchar("entryType", { length: 32 }).notNull().default("custom_rule"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  // Which category/domain this applies to (null = global)
  category: varchar("category", { length: 64 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserKnowledgeBase = typeof userKnowledgeBase.$inferSelect;
export type InsertUserKnowledgeBase = typeof userKnowledgeBase.$inferInsert;
