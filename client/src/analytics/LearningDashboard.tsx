/**
 * LearningDashboard - 个人学习洞察仪表盘
 * 展示使用数据、偏好分析和技能进度
 */

import React from 'react';
import { useInsightReport, usePreferences } from '../hooks/useAnalytics';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Zap, 
  Award,
  Brain,
  Calendar,
  BarChart3,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const LearningDashboard: React.FC = () => {
  const { report, loading: reportLoading, error: reportError } = useInsightReport();
  const { preferences, loading: prefLoading } = usePreferences();

  if (reportLoading || prefLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <p>加载失败，请稍后重试</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            刷新
          </button>
        </div>
      </div>
    );
  }

  const { summary, insights, recommendations, skillProgress } = report;

  const levelColors: Record<string, string> = {
    beginner: 'bg-gray-100 text-gray-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
    expert: 'bg-amber-100 text-amber-700'
  };

  const levelNames: Record<string, string> = {
    beginner: '初学者',
    intermediate: '进阶者',
    advanced: '高级用户',
    expert: '专家'
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 头部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            个人学习洞察
          </h1>
          <p className="text-gray-500 mt-1">
            基于 {summary.totalSessions} 次使用记录生成的个性化分析
          </p>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${levelColors[skillProgress.currentLevel]}`}>
            {levelNames[skillProgress.currentLevel]}
          </span>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="总优化次数"
          value={summary.totalSessions}
          trend={summary.improvement}
          color="blue"
        />
        <MetricCard
          icon={<Calendar className="w-5 h-5" />}
          label="活跃天数"
          value={summary.activeDays}
          subtext={`连续 ${summary.streakDays} 天`}
          color="green"
        />
        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="技能进度"
          value={`${skillProgress.progressPercent}%`}
          subtext={skillProgress.nextMilestone}
          color="purple"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="解锁功能"
          value={skillProgress.unlockedFeatures.length}
          subtext="点击查看详情"
          color="amber"
        />
      </div>

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：洞察列表 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 关键洞察 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              关键洞察
            </h2>
            <div className="space-y-3">
              {insights.map((insight: any, index: number) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          </section>

          {/* 个性化建议 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              提升建议
            </h2>
            <div className="space-y-4">
              {recommendations.map((rec: any, index: number) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          </section>
        </div>

        {/* 右侧：偏好分析 */}
        <div className="space-y-6">
          {/* 模型偏好 */}
          {preferences?.modelRanking && preferences.modelRanking.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                模型偏好
              </h3>
              <div className="space-y-3">
                {preferences.modelRanking.slice(0, 3).map((model: any, idx: number) => (
                  <div key={model.model} className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${idx === 0 ? 'bg-amber-100 text-amber-700' : 
                        idx === 1 ? 'bg-gray-100 text-gray-600' : 
                        'bg-orange-100 text-orange-700'}
                    `}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{model.model}</span>
                        <span className="text-sm text-gray-500">{model.score.toFixed(0)}分</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${model.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 时段偏好 */}
          {preferences?.peakHours && preferences.peakHours.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                活跃时段
              </h3>
              <div className="space-y-2">
                {preferences.peakHours.slice(0, 4).map((peak: any) => (
                  <div key={peak.hour} className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{peak.description}</span>
                    <span className={`
                      ml-auto text-xs px-2 py-0.5 rounded-full
                      ${peak.intensity === 'high' ? 'bg-red-100 text-red-700' : 
                        peak.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'}
                    `}>
                      {peak.intensity === 'high' ? '高峰' : 
                       peak.intensity === 'medium' ? '活跃' : '一般'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 工作风格 */}
          {preferences?.modePreference && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                工作风格
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">评估模式</span>
                  <span className="font-medium">{(preferences.modePreference.evaluate * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${preferences.modePreference.evaluate * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">迭代模式</span>
                  <span className="font-medium">{(preferences.modePreference.iterate * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${preferences.modePreference.iterate * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  {preferences.modePreference.insight}
                </p>
              </div>
            </section>
          )}

          {/* 质量追求 */}
          {preferences?.qualityExpectation && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                质量追求
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {preferences.qualityExpectation.type === 'perfectionist' ? '完美主义者' :
                     preferences.qualityExpectation.type === 'pragmatist' ? '实用主义者' : '探索者'}
                  </p>
                  <p className="text-xs text-gray-500">
                    目标分数: {preferences.qualityExpectation.avgTargetScore} ± {preferences.qualityExpectation.scoreVariance}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// 指标卡片组件
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  subtext?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, trend, subtext, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.includes('提升') || trend.includes('进步') ? 'bg-green-100 text-green-700' :
            trend.includes('稳定') ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

// 洞察卡片组件
const InsightCard: React.FC<{ insight: any }> = ({ insight }) => {
  const categoryIcons: Record<string, React.ReactNode> = {
    pattern: <Clock className="w-4 h-4" />,
    preference: <Target className="w-4 h-4" />,
    suggestion: <Sparkles className="w-4 h-4" />,
    achievement: <Award className="w-4 h-4" />
  };

  const categoryColors: Record<string, string> = {
    pattern: 'bg-blue-50 text-blue-700 border-blue-200',
    preference: 'bg-purple-50 text-purple-700 border-purple-200',
    suggestion: 'bg-amber-50 text-amber-700 border-amber-200',
    achievement: 'bg-green-50 text-green-700 border-green-200'
  };

  const categoryNames: Record<string, string> = {
    pattern: '模式',
    preference: '偏好',
    suggestion: '建议',
    achievement: '成就'
  };

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${categoryColors[insight.category]}`}>
      <div className="flex-shrink-0">
        {categoryIcons[insight.category]}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-75">
            {categoryNames[insight.category]}
          </span>
          {insight.priority === 'high' && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
              重要
            </span>
          )}
        </div>
        <h3 className="font-semibold">{insight.title}</h3>
        <p className="text-sm opacity-90 mt-1">{insight.description}</p>
      </div>
    </div>
  );
};

// 建议卡片组件
const RecommendationCard: React.FC<{ recommendation: any }> = ({ recommendation }) => {
  const typeColors: Record<string, string> = {
    model: 'bg-blue-50 border-blue-200',
    mode: 'bg-purple-50 border-purple-200',
    skill: 'bg-green-50 border-green-200',
    habit: 'bg-amber-50 border-amber-200'
  };

  const typeNames: Record<string, string> = {
    model: '模型',
    mode: '模式',
    skill: '技能',
    habit: '习惯'
  };

  return (
    <div className={`p-4 rounded-lg border ${typeColors[recommendation.type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">
              {typeNames[recommendation.type]}
            </span>
            <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">{recommendation.reason}</p>
          <div className="bg-white/50 rounded p-2 text-sm">
            <span className="font-medium text-gray-700">行动：</span>
            {recommendation.action}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 预期收益：{recommendation.expectedBenefit}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
};

export default LearningDashboard;
