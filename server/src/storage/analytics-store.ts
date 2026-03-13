/**
 * Analytics Store - 个人学习数据存储
 * 使用与主系统相同的 sqlite3
 */

import { getDB } from '../db/sqlite';

export interface UsageSession {
  id: string;
  timestamp: number;
  mode: 'evaluate' | 'iterate';
  model: string;
  duration: number;
  inputLength: number;
  outputLength: number;
  iterations?: number;
  score?: number;
  success: boolean;
  errorType?: string;
}

export interface ModelPreference {
  model: string;
  usageCount: number;
  avgScore: number;
  avgLatency: number;
  successRate: number;
  lastUsed: number;
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
  usageCount: number;
  avgDuration: number;
}

class AnalyticsStore {
  
  // 记录新会话
  async recordSession(session: UsageSession): Promise<void> {
    const db = getDB();
    await db.run(`
      INSERT INTO analytics_sessions 
      (id, timestamp, mode, model, duration, input_length, output_length, 
       iterations, score, success, error_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      session.id,
      session.timestamp,
      session.mode,
      session.model,
      session.duration,
      session.inputLength,
      session.outputLength,
      session.iterations || null,
      session.score || null,
      session.success ? 1 : 0,
      session.errorType || null
    ]);
  }

  // 获取时间范围内的会话
  async getSessions(startTime: number, endTime: number): Promise<UsageSession[]> {
    const db = getDB();
    const rows = await db.all(`
      SELECT * FROM analytics_sessions 
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `, [startTime, endTime]);
    
    return rows.map(this.rowToSession);
  }

  // 获取模型使用统计
  async getModelPreferences(days: number = 30): Promise<ModelPreference[]> {
    const db = getDB();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = await db.all(`
      SELECT 
        model,
        COUNT(*) as usage_count,
        AVG(score) as avg_score,
        AVG(duration) as avg_latency,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as success_rate,
        MAX(timestamp) as last_used
      FROM analytics_sessions
      WHERE timestamp >= ?
      GROUP BY model
      ORDER BY usage_count DESC
    `, [cutoff]);
    
    return rows.map((row: any) => ({
      model: row.model,
      usageCount: row.usage_count,
      avgScore: row.avg_score || 0,
      avgLatency: row.avg_latency || 0,
      successRate: row.success_rate || 0,
      lastUsed: row.last_used
    }));
  }

  // 获取使用时段模式
  async getTimePatterns(days: number = 30): Promise<TimePattern[]> {
    const db = getDB();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = await db.all(`
      SELECT 
        CAST(strftime('%H', datetime(timestamp/1000, 'unixepoch')) AS INTEGER) as hour,
        CAST(strftime('%w', datetime(timestamp/1000, 'unixepoch')) AS INTEGER) as day_of_week,
        COUNT(*) as usage_count,
        AVG(duration) as avg_duration
      FROM analytics_sessions
      WHERE timestamp >= ?
      GROUP BY hour, day_of_week
      ORDER BY usage_count DESC
    `, [cutoff]);
    
    return rows.map((row: any) => ({
      hour: row.hour,
      dayOfWeek: row.day_of_week,
      usageCount: row.usage_count,
      avgDuration: row.avg_duration || 0
    }));
  }

  // 获取最近N天的每日统计
  async getDailyStats(days: number = 30): Promise<any[]> {
    const db = getDB();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return await db.all(`
      SELECT 
        date(timestamp/1000, 'unixepoch') as date,
        COUNT(*) as count,
        AVG(score) as avg_score,
        SUM(duration) as total_duration,
        mode
      FROM analytics_sessions
      WHERE timestamp >= ?
      GROUP BY date, mode
      ORDER BY date DESC
    `, [cutoff]);
  }

  // 获取总体统计
  async getOverallStats(): Promise<{
    totalSessions: number;
    totalSuccess: number;
    avgScore: number;
    favoriteModel: string;
    favoriteMode: string;
    avgInputLength: number;
    improvementTrend: number;
  }> {
    const db = getDB();
    
    const total = await db.get('SELECT COUNT(*) as count FROM analytics_sessions');
    const success = await db.get('SELECT COUNT(*) as count FROM analytics_sessions WHERE success = 1');
    const score = await db.get('SELECT AVG(score) as avg FROM analytics_sessions WHERE score IS NOT NULL');
    const favModel = await db.get(`
      SELECT model, COUNT(*) as count FROM analytics_sessions 
      GROUP BY model ORDER BY count DESC LIMIT 1
    `);
    const favMode = await db.get(`
      SELECT mode, COUNT(*) as count FROM analytics_sessions 
      GROUP BY mode ORDER BY count DESC LIMIT 1
    `);
    const inputLen = await db.get(`
      SELECT AVG(input_length) as avg FROM analytics_sessions WHERE input_length > 0
    `);

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const trend = await db.get(`
      SELECT 
        AVG(CASE WHEN timestamp > ? THEN score END) as recent_avg,
        AVG(CASE WHEN timestamp <= ? THEN score END) as old_avg
      FROM analytics_sessions 
      WHERE score IS NOT NULL
    `, [twoWeeksAgo, twoWeeksAgo]);

    return {
      totalSessions: total?.count || 0,
      totalSuccess: success?.count || 0,
      avgScore: score?.avg || 0,
      favoriteModel: favModel?.model || 'unknown',
      favoriteMode: favMode?.mode || 'unknown',
      avgInputLength: inputLen?.avg || 0,
      improvementTrend: (trend?.recent_avg || 0) - (trend?.old_avg || 0)
    };
  }

  // 初始化分析表
  async initAnalyticsTable(): Promise<void> {
    const db = getDB();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        mode TEXT NOT NULL,
        model TEXT NOT NULL,
        duration INTEGER,
        input_length INTEGER,
        output_length INTEGER,
        iterations INTEGER,
        score REAL,
        success INTEGER DEFAULT 1,
        error_type TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_sessions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_analytics_model ON analytics_sessions(model);
      CREATE INDEX IF NOT EXISTS idx_analytics_mode ON analytics_sessions(mode);
    `);
  }

  private rowToSession(row: any): UsageSession {
    return {
      id: row.id,
      timestamp: row.timestamp,
      mode: row.mode,
      model: row.model,
      duration: row.duration,
      inputLength: row.input_length,
      outputLength: row.output_length,
      iterations: row.iterations,
      score: row.score,
      success: row.success === 1,
      errorType: row.error_type
    };
  }
}

export const analyticsStore = new AnalyticsStore();
export default AnalyticsStore;
