/**
 * Insight Generator - 生成个性化洞察报告
 */

import { UserPreferences } from './preference-detector';
import { analyticsStore } from '../storage/analytics-store';

export interface InsightReport {
  generatedAt: number;
  period: { start: number; end: number };
  summary: {
    totalSessions: number;
    activeDays: number;
    streakDays: number;
    improvement: string;
  };
  insights: Array<{
    category: 'pattern' | 'preference' | 'suggestion' | 'achievement';
    title: string;
    description: string;
    data?: any;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    type: 'model' | 'mode' | 'skill' | 'habit';
    title: string;
    reason: string;
    action: string;
    expectedBenefit: string;
  }>;
  skillProgress: {
    currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    progressPercent: number;
    nextMilestone: string;
    unlockedFeatures: string[];
  };
}

export class InsightGenerator {
  
  async generateReport(userId: string = 'default'): Promise<InsightReport> {
    const endTime = Date.now();
    const startTime = endTime - 30 * 24 * 60 * 60 * 1000;
    
    const sessions = await analyticsStore.getSessions(startTime, endTime);
    const preferences = await this.getPreferences(userId);
    const stats = await analyticsStore.getOverallStats();
    
    return {
      generatedAt: endTime,
      period: { start: startTime, end: endTime },
      summary: this.generateSummary(sessions, stats),
      insights: this.generateInsights(sessions, preferences, stats),
      recommendations: this.generateRecommendations(sessions, preferences, stats),
      skillProgress: this.calculateSkillProgress(sessions, stats)
    };
  }

  private generateSummary(sessions: any[], stats: any): InsightReport['summary'] {
    const uniqueDays = new Set(
      sessions.map((s: any) => new Date(s.timestamp).toDateString())
    );
    const sortedDays = Array.from(uniqueDays).sort();

    let streak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;

    for (const dayStr of sortedDays) {
      const current = new Date(dayStr);
      if (lastDate) {
        const diffDays = (current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          streak++;
        } else {
          maxStreak = Math.max(maxStreak, streak);
          streak = 1;
        }
      } else {
        streak = 1;
      }
      lastDate = current;
    }
    maxStreak = Math.max(maxStreak, streak);

    const improvement = stats.improvementTrend > 5 ? '显著提升' :
                       stats.improvementTrend > 0 ? '稳步进步' :
                       stats.improvementTrend > -5 ? '保持稳定' : '需要调整';

    return {
      totalSessions: stats.totalSessions,
      activeDays: uniqueDays.size,
      streakDays: maxStreak,
      improvement
    };
  }

  private generateInsights(sessions: any[], preferences: UserPreferences, stats: any): InsightReport['insights'] {
    const insights: InsightReport['insights'] = [];

    if (preferences.peakHours.length > 0) {
      const peak = preferences.peakHours[0];
      insights.push({
        category: 'pattern',
        title: '你的黄金时段',
        description: `你在${peak.description}最为活跃，建议在此时间段处理复杂任务`,
        data: preferences.peakHours,
        priority: 'high'
      });
    }

    if (preferences.modelRanking.length > 0) {
      const topModel = preferences.modelRanking[0];
      insights.push({
        category: 'preference',
        title: `偏爱 ${topModel.model}`,
        description: `基于${topModel.reasons.join('、')}，这是你目前最信任的模型`,
        data: topModel,
        priority: 'medium'
      });
    }

    insights.push({
      category: 'preference',
      title: '工作风格',
      description: preferences.modePreference.insight,
      data: preferences.modePreference,
      priority: 'medium'
    });

    insights.push({
      category: 'pattern',
      title: '复杂度趋势',
      description: preferences.complexityPreference.description,
      data: preferences.complexityPreference,
      priority: 'low'
    });

    const qualityTypes: Record<string, string> = {
      perfectionist: '完美主义者：你追求高分，对质量要求严格',
      pragmatist: '实用主义者：你追求效率与质量的平衡',
      explorer: '探索者：你在尝试不同的提示词风格'
    };
    insights.push({
      category: 'preference',
      title: '质量追求',
      description: qualityTypes[preferences.qualityExpectation.type],
      data: preferences.qualityExpectation,
      priority: 'medium'
    });

    if (stats.totalSessions >= 50) {
      insights.push({
        category: 'achievement',
        title: '资深用户',
        description: `已完成 ${stats.totalSessions} 次优化，超越了 80% 的用户`,
        priority: 'high'
      });
    } else if (stats.totalSessions >= 20) {
      insights.push({
        category: 'achievement',
        title: '活跃用户',
        description: `已完成 ${stats.totalSessions} 次优化，保持这个节奏！`,
        priority: 'medium'
      });
    }

    if (stats.improvementTrend < 0) {
      insights.push({
        category: 'suggestion',
        title: '分数下滑提醒',
        description: '近期评分有下降趋势，建议尝试迭代模式或更换模型',
        priority: 'high'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateRecommendations(sessions: any[], preferences: UserPreferences, stats: any): InsightReport['recommendations'] {
    const recommendations: InsightReport['recommendations'] = [];

    if (preferences.modelRanking.length > 1) {
      const alternative = preferences.modelRanking[1];
      recommendations.push({
        type: 'model',
        title: `尝试 ${alternative.model}`,
        reason: '该模型在某些场景下可能更适合你的需求',
        action: '在下一次评估中切换到该模型进行对比',
        expectedBenefit: '可能获得更好的质量或速度平衡'
      });
    }

    if (preferences.modePreference.preferred === 'evaluate') {
      recommendations.push({
        type: 'mode',
        title: '尝试迭代模式',
        reason: '你主要使用评估模式，迭代模式可以帮你持续提升分数',
        action: '选择一个中等评分的提示词进行 2-3 轮迭代',
        expectedBenefit: '平均可提升 15-20% 的提示词质量'
      });
    } else if (preferences.modePreference.preferred === 'iterate') {
      recommendations.push({
        type: 'mode',
        title: '使用评估模式快速验证',
        reason: '迭代前先用评估模式建立基线',
        action: '新提示词先用评估模式打分，低于 70 分再迭代',
        expectedBenefit: '节省迭代时间，聚焦真正需要改进的提示词'
      });
    }

    if (preferences.peakHours.length > 0) {
      const bestHour = preferences.peakHours[0].hour;
      recommendations.push({
        type: 'habit',
        title: '利用黄金时段',
        reason: `你在 ${bestHour}:00 效率最高`,
        action: '将复杂的提示词优化安排在这个时间段',
        expectedBenefit: '更好的专注度和更高的评分'
      });
    }

    return recommendations;
  }

  private calculateSkillProgress(sessions: any[], stats: any): InsightReport['skillProgress'] {
    let level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    let progressPercent: number;
    let nextMilestone: string;
    let unlockedFeatures: string[];

    const total = stats.totalSessions;
    const avgScore = stats.avgScore;

    if (total < 10) {
      level = 'beginner';
      progressPercent = (total / 10) * 100;
      nextMilestone = '完成 10 次优化解锁中级功能';
      unlockedFeatures = ['基础评估', '单次迭代'];
    } else if (total < 50 || avgScore < 75) {
      level = 'intermediate';
      progressPercent = Math.min(((total - 10) / 40) * 100, 100);
      nextMilestone = '完成 50 次或平均分达 75 分解锁高级功能';
      unlockedFeatures = ['基础评估', '单次迭代', '历史记录', '模型对比'];
    } else if (total < 100 || avgScore < 85) {
      level = 'advanced';
      progressPercent = Math.min(((total - 50) / 50) * 100, 100);
      nextMilestone = '完成 100 次或平均分达 85 分成为专家';
      unlockedFeatures = ['基础评估', '单次迭代', '历史记录', '模型对比', '批量处理', '自定义评分标准'];
    } else {
      level = 'expert';
      progressPercent = 100;
      nextMilestone = '已解锁所有功能，继续精进技艺';
      unlockedFeatures = ['所有功能', '专家模式', 'Skill 插件系统'];
    }

    return {
      currentLevel: level,
      progressPercent: Math.round(progressPercent),
      nextMilestone,
      unlockedFeatures
    };
  }

  private async getPreferences(userId: string): Promise<UserPreferences> {
    const { PreferenceDetector } = await import('./preference-detector');
    return new PreferenceDetector().analyzePreferences(userId);
  }
}

export const insightGenerator = new InsightGenerator();
