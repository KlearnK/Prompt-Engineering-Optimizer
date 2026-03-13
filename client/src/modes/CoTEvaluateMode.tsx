import React, { useState } from 'react';
import { cotEvaluatePrompt } from '@/services/cot-evaluation-api';
import { ModelSelector } from '@/components/ModelSelector';

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled = false, className = "" }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean;
  className?: string;
}) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

export const CoTEvaluateMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cotEvaluatePrompt({ 
        prompt: prompt.trim(),
        model: selectedModel  // 新增：传递选中的模型
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '评估失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CoT增强评估模式</h2>
          <p className="text-gray-500 mt-1">基于Chain-of-Thought技术，逐步分析提示词质量（使用 {selectedModel === 'deepseek' ? 'DeepSeek' : selectedModel === 'qwen' ? 'Qwen' : 'LLM'}）</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>输入提示词</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 新增：模型选择器 */}
            <div className="mb-4">
              <ModelSelector 
                value={selectedModel} 
                onChange={setSelectedModel} 
                label="选择评估模型"
              />
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入需要评估的提示词..."
              className="w-full min-h-[150px] p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <Button 
              onClick={handleEvaluate} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? `${selectedModel === 'deepseek' ? 'DeepSeek' : selectedModel === 'qwen' ? 'Qwen' : 'LLM'}评估中...` : '开始CoT评估'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">总体评分</h3>
                <span className="text-3xl font-bold text-purple-600">{result.overallScore}/10</span>
              </div>
              <p className="text-gray-700">{result.summary}</p>
            </div>

            {result.dimensionEvaluations?.map((dim: any) => (
              <Card key={dim.key} className="border-l-4 border-l-blue-400">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{dim.dimension}</CardTitle>
                    <Badge className={dim.score >= 8 ? 'bg-green-100 text-green-800' : dim.score >= 6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {dim.score}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-50 p-3 rounded mb-3">
                    <strong className="text-purple-700">思考过程：</strong>
                    <p className="text-sm text-gray-700 mt-1">{dim.reasoning}</p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-sm">改进建议：</strong>
                    {dim.suggestions?.map((s: string, i: number) => (
                      <div key={i} className="text-sm text-gray-600 pl-2">• {s}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};