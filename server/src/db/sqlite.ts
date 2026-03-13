/**
 * SQLite Database Module
 * PromptCraft V5 - Analytics Storage
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const DB_PATH = process.env.DB_PATH || './data/analytics.db';
let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initDatabase(): Promise<void> {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    console.log('[SQLite] Database opened at:', DB_PATH);
    await db.run('PRAGMA foreign_keys = ON');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS usage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        model TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        success BOOLEAN DEFAULT 1,
        error_type TEXT,
        prompt_preview TEXT,
        user_feedback INTEGER
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        confidence REAL DEFAULT 0.5,
        sample_count INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS model_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT UNIQUE NOT NULL,
        total_calls INTEGER DEFAULT 0,
        success_calls INTEGER DEFAULT 0,
        avg_latency_ms REAL DEFAULT 0,
        avg_tokens_per_call REAL DEFAULT 0,
        last_used DATETIME,
        rating REAL DEFAULT 3.0
      )
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_records(model);
      CREATE INDEX IF NOT EXISTS idx_usage_skill ON usage_records(skill_name);
      CREATE INDEX IF NOT EXISTS idx_usage_success ON usage_records(success);
    `);

    console.log('[SQLite] Database schema initialized successfully');
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabase(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new Error('[SQLite] Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function isDatabaseInitialized(): boolean {
  return db !== null;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('[SQLite] Database connection closed');
  }
}

export async function recordUsage(data: {
  model: string;
  skillName: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  success?: boolean;
  errorType?: string;
  promptPreview?: string;
  userFeedback?: number;
}): Promise<void> {
  const database = getDatabase();
  await database.run(
    `INSERT INTO usage_records 
     (model, skill_name, input_tokens, output_tokens, latency_ms, success, error_type, prompt_preview, user_feedback)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.model,
      data.skillName,
      data.inputTokens || 0,
      data.outputTokens || 0,
      data.latencyMs || 0,
      data.success !== false ? 1 : 0,
      data.errorType || null,
      data.promptPreview || null,
      data.userFeedback || null
    ]
  );
}

export async function getUsageStats(days: number = 30): Promise<{
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  modelDistribution: Record<string, number>;
}> {
  const database = getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const totalResult = await database.get(
    'SELECT COUNT(*) as count FROM usage_records WHERE timestamp > ?',
    since.toISOString()
  );

  const successResult = await database.get(
    'SELECT COUNT(*) as count FROM usage_records WHERE timestamp > ? AND success = 1',
    since.toISOString()
  );

  const latencyResult = await database.get(
    'SELECT AVG(latency_ms) as avg FROM usage_records WHERE timestamp > ? AND success = 1',
    since.toISOString()
  );

  const modelDist = await database.all(
    `SELECT model, COUNT(*) as count 
     FROM usage_records 
     WHERE timestamp > ? 
     GROUP BY model`,
    since.toISOString()
  );

  const modelDistribution: Record<string, number> = {};
  modelDist.forEach((row: any) => {
    modelDistribution[row.model] = row.count;
  });

  return {
    totalCalls: totalResult?.count || 0,
    successRate: totalResult?.count > 0 
      ? Math.round((successResult?.count / totalResult?.count) * 100) 
      : 0,
    avgLatency: Math.round(latencyResult?.avg || 0),
    modelDistribution
  };
}

// 别名导出，兼容现有代码
export const initDB = initDatabase;
export const getDB = getDatabase;

export default {
  initDatabase,
  getDatabase,
  isDatabaseInitialized,
  closeDatabase,
  recordUsage,
  getUsageStats,
  initDB: initDatabase,
  getDB: getDatabase
};