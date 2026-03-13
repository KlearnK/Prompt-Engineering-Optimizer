import React, { useState } from 'react';
import { reactIteratePrompt } from '@/services/react-iteration-api';
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
    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

export const ReactIterateMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek');
  const [strategy, setStrategy] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const strategies = [
    { value: 'general', label: '通用优化' },
    { value: 'clarity', label: '清晰度优先' },
    { value: 'structure', label: '结构性优先' },
    { value: 'creative', label: '创意增强' }
  ];

  const handleIterate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reactIteratePrompt({ 
        prompt: prompt.trim(), 
        strategy,
        model: selectedModel  // 新增：传递选中的模型
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '迭代失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ReAct迭代优化模式</h2>
          <p className="text-gray-500 mt-1">基于ReAct框架的多轮提示词优化，使用 {selectedModel === 'deepseek' ? 'DeepSeek' : selectedModel === 'qwen' ? 'Qwen' : 'LLM'}（约需2-3分钟）</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>输入与配置</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 新增：模型选择器 */}
            <div className="mb-4">
              <ModelSelector 
                value={selectedModel} 
                onChange={setSelectedModel} 
                label="选择优化模型"
              />
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入需要迭代的提示词..."
              className="w-full min-h-[120px] p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-4">
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="border rounded-lg px-4 py-2"
              >
                {strategies.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Button 
                onClick={handleIterate} 
                disabled={loading || !prompt.trim()}
                className="flex-1"
              >
                {loading ? `${selectedModel === 'deepseek' ? 'DeepSeek' : selectedModel === 'qwen' ? 'Qwen' : 'LLM'}迭代中（约2-3分钟）...` : '开始ReAct迭代'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">优化完成</h3>
                  <p className="text-gray-600 mt-1">{result.improvementSummary}</p>
                </div>
                <span className="text-4xl font-bold text-blue-600">
                  {result.qualityTrend?.[result.qualityTrend.length - 1]}/10
                </span>
              </div>
            </div>

            <Card className="border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle>最终优化结果</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-white p-4 rounded text-sm whitespace-pre-wrap border">
                  {result.finalPrompt}
                </pre>
                <Button 
                  onClick={() => navigator.clipboard.writeText(result.finalPrompt)}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  复制结果
                </Button>
              </CardContent>
            </Card>

            {result.steps?.map((step: any, idx: number) => (
              <Card key={idx} className="border-l-4 border-l-purple-400">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>第 {step.round} 轮</CardTitle>
                    <Badge className={step.qualityScore >= 8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {step.qualityScore}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="bg-purple-50 p-2 rounded"><strong>思考：</strong>{step.thought}</div>
                  <div className="bg-blue-50 p-2 rounded"><strong>行动：</strong>{step.action}</div>
                  <div className="bg-green-50 p-2 rounded"><strong>观察：</strong>{step.observation}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};