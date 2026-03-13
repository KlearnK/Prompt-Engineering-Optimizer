import React, { useState } from 'react';
import { Brain, Database, BarChart3 } from 'lucide-react';
import { InsightDashboard } from '@/components/analytics/InsightDashboard';
import { DataManager } from '@/components/analytics/DataManager';
import { useOptimizationHistory } from '@/hooks/useOptimizationHistory';

const LearningInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          个人学习洞察
        </h1>
        <p className="text-gray-500">
          追踪您的提示词优化历程，分析使用偏好
        </p>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
        >
          <BarChart3 className="w-4 h-4" />
          概览分析
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
        >
          <Brain className="w-4 h-4" />
          历史记录
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2 ${activeTab === 'data' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
        >
          <Database className="w-4 h-4" />
          数据管理
        </button>
      </div>

      {activeTab === 'overview' && <InsightDashboard />}
      {activeTab === 'history' && <HistoryList />}
      {activeTab === 'data' && <DataManager />}
    </div>
  );
};

const HistoryList: React.FC = () => {
  const { optimizations, evaluations, loading } = useOptimizationHistory();
  const [filter, setFilter] = useState<'all' | 'optimization' | 'evaluation'>('all');

  if (loading) return <div className="text-center p-8">加载中...</div>;

  const allRecords = [
    ...optimizations.map(o => ({ ...o, type: 'optimization' as const })),
    ...evaluations.map(e => ({ ...e, type: 'evaluation' as const })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const filteredRecords = filter === 'all' ? allRecords : allRecords.filter(r => r.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'optimization', 'evaluation'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded-full text-sm ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            {f === 'all' ? '全部' : f === 'optimization' ? '优化' : '评估'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">暂无历史记录</div>
        ) : (
          filteredRecords.map((record, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded ${record.type === 'optimization' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {record.type === 'optimization' ? '优化' : '评估'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(record.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm line-clamp-2">
                {(record as any).originalPrompt || (record as any).prompt}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LearningInsights;