/**
 * Analytics Routes - 个人学习系统 API
 */

import { Router } from 'express';
import { analyticsStore } from '../storage/analytics-store';
import { preferenceDetector } from '../analytics/preference-detector';
import { insightGenerator } from '../analytics/insight-generator';

const router = Router();

/**
 * GET /api/analytics/preferences
 * 获取用户偏好分析
 */
router.get('/preferences', async (req, res) => {
  try {
    const preferences = await preferenceDetector.analyzePreferences();
    res.json({
      success: true,
      data: preferences,
      generatedAt: Date.now()
    });
  } catch (error: any) {
    console.error('Failed to get preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze preferences'
    });
  }
});

/**
 * GET /api/analytics/report
 * 获取完整洞察报告
 */
router.get('/report', async (req, res) => {
  try {
    const report = await insightGenerator.generateReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Failed to generate report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * GET /api/analytics/stats
 * 获取基础统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await analyticsStore.getOverallStats();
    const dailyStats = await analyticsStore.getDailyStats(days);
    const modelPreferences = await analyticsStore.getModelPreferences(days);

    res.json({
      success: true,
      data: {
        overall: stats,
        daily: dailyStats,
        models: modelPreferences
      }
    });
  } catch (error: any) {
    console.error('Failed to get stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * GET /api/analytics/history
 * 获取详细历史记录
 */
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const endTime = Date.now();
    const startTime = endTime - days * 24 * 60 * 60 * 1000;
    
    const sessions = await analyticsStore.getSessions(startTime, endTime);
    
    res.json({
      success: true,
      data: sessions,
      meta: {
        total: sessions.length,
        period: { start: startTime, end: endTime }
      }
    });
  } catch (error: any) {
    console.error('Failed to get history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history'
    });
  }
});

/**
 * POST /api/analytics/session
 * 记录新会话（内部使用）
 */
router.post('/session', async (req, res) => {
  try {
    const session = req.body;
    await analyticsStore.recordSession({
      ...session,
      id: session.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: session.timestamp || Date.now()
    });
    
    res.json({
      success: true,
      message: 'Session recorded'
    });
  } catch (error: any) {
    console.error('Failed to record session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record session'
    });
  }
});

export default router;
