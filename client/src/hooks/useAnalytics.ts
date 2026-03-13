/**
 * useAnalytics Hook - 个人学习数据获取
 */

import { useState, useEffect, useCallback } from 'react';

// 使用环境变量或默认值
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

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

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/analytics/preferences`);
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.data);
      } else {
        setError(result.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return { preferences, loading, error, refetch: fetchPreferences };
}

export function useInsightReport() {
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/analytics/report`);
      const result = await response.json();
      
      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.error || 'Failed to load report');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refetch: fetchReport };
}

export function useStats(days: number = 30) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/stats?days=${days}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) setStats(result.data);
      })
      .finally(() => setLoading(false));
  }, [days]);

  return { stats, loading };
}
