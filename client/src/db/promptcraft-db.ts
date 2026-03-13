import Dexie, { Table } from 'dexie';

// 类型定义
export interface OptimizationRecord {
  id?: number;
  originalPrompt: string;
  optimizedPrompt: string;
  technique: string;
  modelUsed: string;
  timestamp: Date;
  qualityScore?: number;
  latency?: number;
}

export interface EvaluationRecord {
  id?: number;
  prompt: string;
  dimensions: {
    clarity: number;
    specificity: number;
    structure: number;
    completeness: number;
    tone: number;
    constraints: number;
  };
  overallScore: number;
  suggestions: string[];
  timestamp: Date;
  modelUsed: string;
}

export interface UsageStats {
  id?: number;
  date: string; // YYYY-MM-DD
  techniqueCounts: Record<string, number>;
  modelCounts: Record<string, number>;
  avgQualityScore: number;
  totalOptimizations: number;
  totalEvaluations: number;
}

export class PromptCraftDB extends Dexie {
  optimizations!: Table<OptimizationRecord>;
  evaluations!: Table<EvaluationRecord>;
  usageStats!: Table<UsageStats>;

  constructor() {
    super('PromptCraftDB');
    this.version(1).stores({
      optimizations: '++id, timestamp, technique, modelUsed',
      evaluations: '++id, timestamp, modelUsed',
      usageStats: '++id, date',
    });
  }
}

export const db = new PromptCraftDB();

// 辅助函数：获取今日日期字符串
export const getTodayString = () => new Date().toISOString().split('T')[0];

// 辅助函数：更新使用统计
export async function updateUsageStats(
  type: 'optimization' | 'evaluation',
  technique?: string,
  modelUsed?: string,
  qualityScore?: number
) {
  const today = getTodayString();
  
  let stats = await db.usageStats.get({ date: today });
  
  if (!stats) {
    stats = {
      date: today,
      techniqueCounts: {},
      modelCounts: {},
      avgQualityScore: 0,
      totalOptimizations: 0,
      totalEvaluations: 0,
    };
  }

  if (type === 'optimization') {
    stats.totalOptimizations++;
    if (technique) {
      stats.techniqueCounts[technique] = (stats.techniqueCounts[technique] || 0) + 1;
    }
  } else {
    stats.totalEvaluations++;
  }

  if (modelUsed) {
    stats.modelCounts[modelUsed] = (stats.modelCounts[modelUsed] || 0) + 1;
  }

  if (qualityScore !== undefined) {
    const total = stats.totalOptimizations + stats.totalEvaluations;
    stats.avgQualityScore = (stats.avgQualityScore * (total - 1) + qualityScore) / total;
  }

  await db.usageStats.put(stats);
}

export default db;