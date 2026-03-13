import React, { useEffect, useState } from 'react';
import { TrendingUp, PieChart, BarChart3, Star, Activity } from 'lucide-react';
import { db } from '@/db/promptcraft-db';
import { useOptimizationHistory } from '@/hooks/useOptimizationHistory';

interface AnalyticsData {
  totalOptimizations: number;
  totalEvaluations: number;
  avgQualityScore: number;
  favoriteTechnique: string;
  favoriteModel: string;
  techniqueDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
}

export const InsightDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { optimizations, evaluations } = useOptimizationHistory();

  useEffect(() => {
    const loadAnalytics = async () => {
      const allStats = await db.usageStats.toArray();
      const totalOptimizations = allStats.reduce((sum, s) => sum + s.totalOptimizations, 0);
      const totalEvaluations = allStats.reduce((sum, s) => sum + s.totalEvaluations, 0);
      const avgQualityScore = allStats.length > 0
        ? allStats.reduce((sum, s) => sum + s.avgQualityScore, 0) / allStats.length
        : 0;

      const techniqueDistribution: Record<string, number> = {};
      const modelDistribution: Record<string, number> = {};
      
      allStats.forEach(s => {
        Object.entries(s.techniqueCounts).forEach(([tech, count]) => {
          techniqueDistribution[tech] = (techniqueDistribution[tech] || 0) + count;
        });
        Object.entries(s.modelCounts).forEach(([model, count]) => {
          modelDistribution[model] = (modelDistribution[model] || 0) + count;
        });
      });

      const favoriteTechnique = Object.entries(techniqueDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || '暂无';
      const favoriteModel = Object.entries(modelDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || '暂无';

      setAnalytics({
        totalOptimizations,
        totalEvaluations,
        avgQualityScore,
        favoriteTechnique,
        favoriteModel,
        techniqueDistribution,
        modelDistribution,
      });
      setLoading(false);
    };
    loadAnalytics();
  }, [optimizations, evaluations]);

  if (loading) return <div className="flex justify-center p-8">加载中...</div>;
  
  if (!analytics || (analytics.totalOptimizations === 0 && analytics.totalEvaluations === 0)) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无使用数据</p>
        <p className="text-sm">开始使用优化和评估功能后，这里将显示您的个人洞察</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总优化次数</p>
              <p className="text-2xl font-bold">{analytics.totalOptimizations}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总评估次数</p>
              <p className="text-2xl font-bold">{analytics.totalEvaluations}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均质量分</p>
              <p className="text-2xl font-bold">{analytics.avgQualityScore.toFixed(1)}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">常用技巧</p>
              <p className="text-lg font-bold truncate">{analytics.favoriteTechnique}</p>
            </div>
            <PieChart className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">技术偏好分布</h3>
          <div className="space-y-2">
            {Object.entries(analytics.techniqueDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tech, count]) => (
              <div key={tech} className="flex items-center justify-between">
                <span className="text-sm">{tech}</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">模型使用分布</h3>
          <div className="space-y-2">
            {Object.entries(analytics.modelDistribution).sort((a, b) => b[1] - a[1]).map(([model, count]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="text-sm">{model}</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightDashboard;