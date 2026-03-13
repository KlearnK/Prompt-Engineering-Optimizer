import fs from 'fs';
import path from 'path';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export interface BackupMetadata {
  version: string;
  createdAt: string;
  description?: string;
  recordCounts: {
    usage: number;
    preferences: number;
    insights: number;
  };
}

export interface BackupData {
  metadata: BackupMetadata;
  usage: any[];
  preferences: any[];
  insights: any[];
}

export class BackupManager {
  private db: Database<sqlite3.Database, sqlite3.Statement>;
  private backupDir: string;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>, backupDir: string = './data/backups') {
    this.db = db;
    this.backupDir = backupDir;
    this.ensureBackupDir();
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // 导出所有数据为 JSON
  async exportToJSON(description?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    const data: BackupData = {
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        description,
        recordCounts: {
          usage: 0,
          preferences: 0,
          insights: 0
        }
      },
      usage: [],
      preferences: [],
      insights: []
    };

    // 导出使用记录
    data.usage = await this.queryTable('usage_records');
    data.metadata.recordCounts.usage = data.usage.length;

    // 导出偏好设置
    data.preferences = await this.queryTable('preferences');
    data.metadata.recordCounts.preferences = data.preferences.length;

    // 导出模型统计（作为 insights）
    data.insights = await this.queryTable('model_stats');
    data.metadata.recordCounts.insights = data.insights.length;

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    
    return filepath;
  }

  // 从 JSON 导入数据
  async importFromJSON(filepath: string, merge: boolean = false): Promise<BackupMetadata> {
    if (!fs.existsSync(filepath)) {
      throw new Error(`备份文件不存在: ${filepath}`);
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const data: BackupData = JSON.parse(content);

    // 验证数据结构
    if (!data.metadata || !data.usage || !data.preferences || !data.insights) {
      throw new Error('无效的备份文件格式');
    }

    if (!merge) {
      // 清空现有数据
      await this.clearTable('usage_records');
      await this.clearTable('preferences');
      await this.clearTable('model_stats');
    }

    // 导入使用记录
    for (const record of data.usage) {
      await this.insertRecord('usage_records', record);
    }

    // 导入偏好设置
    for (const pref of data.preferences) {
      await this.insertRecord('preferences', pref);
    }

    // 导入模型统计
    for (const insight of data.insights) {
      await this.insertRecord('model_stats', insight);
    }

    return data.metadata;
  }

  // 获取备份列表
  listBackups(): Array<{ filename: string; metadata: BackupMetadata; size: number }> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    return fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const filepath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filepath);
        try {
          const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
          return {
            filename,
            metadata: content.metadata,
            size: stats.size
          };
        } catch {
          return {
            filename,
            metadata: { version: 'unknown', createdAt: 'unknown', recordCounts: { usage: 0, preferences: 0, insights: 0 } },
            size: stats.size
          };
        }
      })
      .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());
  }

  // 删除备份
  deleteBackup(filename: string): boolean {
    const filepath = path.join(this.backupDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }

  // 自动备份（保留最近 N 个）
  async autoBackup(maxBackups: number = 10): Promise<string> {
    const filepath = await this.exportToJSON('自动备份');
    
    // 清理旧备份
    const backups = this.listBackups();
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      for (const backup of toDelete) {
        this.deleteBackup(backup.filename);
      }
    }
    
    return filepath;
  }

  // 辅助方法
  private async queryTable(table: string): Promise<any[]> {
    return this.db.all(`SELECT * FROM ${table}`);
  }

  private async clearTable(table: string): Promise<void> {
    await this.db.run(`DELETE FROM ${table}`);
  }

  private async insertRecord(table: string, record: any): Promise<void> {
    const keys = Object.keys(record).filter(k => k !== 'id');
    const placeholders = keys.map(() => '?').join(',');
    const values = keys.map(k => record[k]);
    
    await this.db.run(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
      values
    );
  }
}
