import React, { useState, useCallback } from 'react';
import { 
  compareModels, 
  ComparisonResponse,
  getWinnerName,
  getConsistencyRating,
  getConsistencyColor
} from '@/services/model-comparison-api';
import { Loader2, Trophy, Clock, Copy, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

const ModelComparisonMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [taskType, setTaskType] = useState<'optimization' | 'evaluation'>('optimization');
  const [votingStrategy, setVotingStrategy] = useState<'majority' | 'llm-judge' | 'hybrid'>('hybrid');
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCompare = useCallback(async () => {
    if (!prompt.trim()) {
      alert('请输入需要对比的提示词');
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      // 不再传递 selectedModel，使用默认的混合策略
      const data = await compareModels(prompt.trim(), taskType, votingStrategy);
      setResult(data);
      alert(`对比完成！获胜者: ${getWinnerName(data.voting.winner)}`);
    } catch (error) {
      console.error('对比失败:', error);
      alert(error instanceof Error ? error.message : '对比请求失败');
    } finally {
      setLoading(false);
    }
  }, [prompt, taskType, votingStrategy]);

  const handleCopy = useCallback(() => {
    if (result?.bestOutput) {
      navigator.clipboard.writeText(result.bestOutput);
      setCopied(true);
      alert('已复制最佳结果');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const getModelColor = (modelId: string) => {
    const colors: Record<string, string> = {
      'deepseek-v3': 'bg-blue-500',
      'qwen-max': 'bg-purple-500',
      'glm-4': 'bg-green-500',
      'gpt-4': 'bg-orange-500',
    };
    return colors[modelId] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          多模型对比测试
        </h1>
        <p className="text-gray-500">
          同时调用4个顶级LLM，通过Self-Consistency投票选出最佳结果
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">配置对比参数</h3>
        
        {/* 移除了基准模型选择器 */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">任务类型</label>
            <select 
              value={taskType} 
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full border rounded p-2"
            >
              <option value="optimization">提示词优化</option>
              <option value="evaluation">提示词评估</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">投票策略</label>
            <select 
              value={votingStrategy} 
              onChange={(e) => setVotingStrategy(e.target.value as any)}
              className="w-full border rounded p-2"
            >
              <option value="hybrid">混合策略（推荐）</option>
              <option value="majority">简单多数投票</option>
              <option value="llm-judge">LLM评判</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">输入提示词</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="请输入需要优化或评估的提示词..."
            className="w-full border rounded p-2 min-h-[120px]"
          />
        </div>
        <button 
          onClick={handleCompare} 
          disabled={loading || !prompt.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              正在对比4个模型...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              开始多模型对比
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getModelColor(result.voting.winner || '')}`}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    获胜者: {getWinnerName(result.voting.winner)}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-sm ${getConsistencyColor(result.voting.consistencyScore)}`}>
                      一致性: {getConsistencyRating(result.voting.consistencyScore)} ({Math.round(result.voting.consistencyScore * 100)}%)
                    </span>
                    <span className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(result.totalLatency / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={handleCopy} className="border px-3 py-1 rounded text-sm flex items-center gap-1">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制结果'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.results.map((modelResult) => (
              <div key={modelResult.model} className={`bg-white rounded-lg shadow p-4 ${modelResult.model === result.voting.winner ? 'border-2 border-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getModelColor(modelResult.model)}`} />
                    <h3 className="font-semibold">{modelResult.modelName}</h3>
                    {modelResult.model === result.voting.winner && <Trophy className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {(modelResult.latency / 1000).toFixed(1)}s
                  </span>
                </div>
                {modelResult.error ? (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {modelResult.error}
                  </div>
                ) : (
                  <div className="bg-gray-100 p-3 rounded text-sm max-h-60 overflow-y-auto">
                    {modelResult.output}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelComparisonMode;