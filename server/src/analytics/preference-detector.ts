/**
 * Preference Detector - 自动检测用户使用偏好
 */

import { analyticsStore, UsageSession } from '../storage/analytics-store';

export interface UserPreferences {
  modelRanking: Array<{
    model: string;
    score: number;
    reasons: string[];
  }>;
  peakHours: Array<{
    hour: number;
    intensity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  modePreference: {
    evaluate: number;
    iterate: number;
    preferred: 'evaluate' | 'iterate' | 'balanced';
    insight: string;
  };
  complexityPreference: {
    avgInputLength: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    description: string;
  };
  qualityExpectation: {
    avgTargetScore: number;
    scoreVariance: number;
    type: 'perfectionist' | 'pragmatist' | 'explorer';
  };
}

export class PreferenceDetector {
  
  async analyzePreferences(userId: string = 'default'): Promise<UserPreferences> {
    const sessions = await analyticsStore.getSessions(
      Date.now() - 30 * 24 * 60 * 60 * 1000, 
      Date.now()
    );

    if (sessions.length === 0) {
      return this.getDefaultPreferences();
    }

    return {
      modelRanking: this.analyzeModelPreference(sessions),
      peakHours: this.analyzeTimePreference(sessions),
      modePreference: this.analyzeModePreference(sessions),
      complexityPreference: this.analyzeComplexityPreference(sessions),
      qualityExpectation: this.analyzeQualityExpectation(sessions)
    };
  }

  private analyzeModelPreference(sessions: UsageSession[]): UserPreferences['modelRanking'] {
    const modelStats = new Map<string, {
      count: number;
      scores: number[];
      latencies: number[];
      successes: number;
    }>();

    sessions.forEach(s => {
      const stats = modelStats.get(s.model) || { count: 0, scores: [], latencies: [], successes: 0 };
      stats.count++;
      if (s.score) stats.scores.push(s.score);
      if (s.duration) stats.latencies.push(s.duration);
      if (s.success) stats.successes++;
      modelStats.set(s.model, stats);
    });

    const rankings = Array.from(modelStats.entries()).map(([model, stats]) => {
      const avgScore = stats.scores.length > 0 
        ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length 
        : 0;
      const avgLatency = stats.latencies.length > 0
        ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
        : 0;
      const successRate = stats.count > 0 ? stats.successes / stats.count : 0;

      const frequencyScore = Math.min(stats.count / 10, 1) * 30;
      const qualityScore = (avgScore / 100) * 25;
      const reliabilityScore = successRate * 25;
      const speedScore = Math.max(0, 1 - avgLatency / 30) * 20;

      const totalScore = frequencyScore + qualityScore + reliabilityScore + speedScore;

      const reasons: string[] = [];
      if (stats.count >= 5) reasons.push(`高频使用 (${stats.count}次)`);
      if (avgScore >= 80) reasons.push(`质量优秀 (均分${avgScore.toFixed(1)})`);
      if (successRate >= 0.95) reasons.push(`稳定可靠`);
      if (avgLatency < 10) reasons.push(`响应迅速`);
      if (reasons.length === 0) reasons.push('初步尝试');

      return { model, score: totalScore, reasons };
    });

    return rankings.sort((a, b) => b.score - a.score);
  }

  private analyzeTimePreference(sessions: UsageSession[]): UserPreferences['peakHours'] {
    const hourCounts = new Array(24).fill(0);
    sessions.forEach(s => {
      const hour = new Date(s.timestamp).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const threshold = maxCount * 0.5;

    const peaks: UserPreferences['peakHours'] = [];
    
    hourCounts.forEach((count, hour) => {
      if (count >= threshold && count > 0) {
        const intensity: 'high' | 'medium' | 'low' = 
          count >= maxCount * 0.8 ? 'high' : 
          count >= maxCount * 0.5 ? 'medium' : 'low';
        
        const timeDesc = hour < 6 ? '深夜' : 
                        hour < 9 ? '早晨' : 
                        hour < 12 ? '上午' : 
                        hour < 14 ? '中午' : 
                        hour < 18 ? '下午' : '晚上';
        
        peaks.push({
          hour,
          intensity,
          description: `${timeDesc} ${hour}:00-${hour + 1}:00 (${count}次)`
        });
      }
    });

    return peaks.sort((a, b) => hourCounts[b.hour] - hourCounts[a.hour]).slice(0, 5);
  }

  private analyzeModePreference(sessions: UsageSession[]): UserPreferences['modePreference'] {
    const evaluateCount = sessions.filter(s => s.mode === 'evaluate').length;
    const iterateCount = sessions.filter(s => s.mode === 'iterate').length;
    const total = sessions.length;

    const evaluateRatio = total > 0 ? evaluateCount / total : 0.5;
    const iterateRatio = total > 0 ? iterateCount / total : 0.5;

    let preferred: 'evaluate' | 'iterate' | 'balanced';
    let insight: string;

    if (Math.abs(evaluateRatio - iterateRatio) < 0.2) {
      preferred = 'balanced';
      insight = '你在评估和迭代之间保持平衡，既注重快速验证也追求持续优化';
    } else if (evaluateRatio > iterateRatio) {
      preferred = 'evaluate';
      insight = evaluateRatio > 0.8 
        ? '你偏好快速评估模式，倾向于一次性获得反馈'
        : '你稍微偏好评估模式，喜欢先了解当前水平再决定';
    } else {
      preferred = 'iterate';
      insight = iterateRatio > 0.8
        ? '你是典型的迭代优化者，享受逐步改进的过程'
        : '你稍微偏好迭代模式，愿意花时间打磨提示词';
    }

    return {
      evaluate: evaluateRatio,
      iterate: iterateRatio,
      preferred,
      insight
    };
  }

  private analyzeComplexityPreference(sessions: UsageSession[]): UserPreferences['complexityPreference'] {
    const recentSessions = sessions.slice(0, Math.floor(sessions.length / 2));
    const oldSessions = sessions.slice(Math.floor(sessions.length / 2));

    const recentAvg = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.inputLength, 0) / recentSessions.length
      : 0;
    const oldAvg = oldSessions.length > 0
      ? oldSessions.reduce((sum, s) => sum + s.inputLength, 0) / oldSessions.length
      : 0;

    const trend: 'increasing' | 'decreasing' | 'stable' = 
      recentAvg > oldAvg * 1.2 ? 'increasing' :
      recentAvg < oldAvg * 0.8 ? 'decreasing' : 'stable';

    const descriptions: Record<typeof trend, string> = {
      increasing: '你正在处理越来越复杂的提示词，技能在提升',
      decreasing: '你更倾向于精炼简洁的提示词，追求效率',
      stable: '你保持稳定的提示词复杂度，风格一致'
    };

    return {
      avgInputLength: Math.round(recentAvg),
      trend,
      description: descriptions[trend]
    };
  }

  private analyzeQualityExpectation(sessions: UsageSession[]): UserPreferences['qualityExpectation'] {
    const scoredSessions = sessions.filter(s => s.score !== undefined);
    
    if (scoredSessions.length === 0) {
      return {
        avgTargetScore: 85,
        scoreVariance: 10,
        type: 'explorer'
      };
    }

    const scores = scoredSessions.map(s => s.score!);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    let type: 'perfectionist' | 'pragmatist' | 'explorer';
    
    if (avg >= 90 && stdDev < 10) {
      type = 'perfectionist';
    } else if (avg >= 75 && stdDev < 15) {
      type = 'pragmatist';
    } else {
      type = 'explorer';
    }

    return {
      avgTargetScore: Math.round(avg),
      scoreVariance: Math.round(stdDev),
      type
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      modelRanking: [],
      peakHours: [],
      modePreference: {
        evaluate: 0.5,
        iterate: 0.5,
        preferred: 'balanced',
        insight: '数据不足，默认平衡模式'
      },
      complexityPreference: {
        avgInputLength: 0,
        trend: 'stable',
        description: '等待更多数据'
      },
      qualityExpectation: {
        avgTargetScore: 85,
        scoreVariance: 10,
        type: 'explorer'
      }
    };
  }
}

export const preferenceDetector = new PreferenceDetector();
