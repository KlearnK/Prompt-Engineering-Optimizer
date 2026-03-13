import React, { useState } from 'react';
import { evaluatePrompt, EvaluationResponse } from '@/services/optimization-api';
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

const Button = ({ children, onClick, disabled = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
    {children}
  </button>
);

const Textarea = ({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} className="flex min-h-[300px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
);

const Progress = ({ value }: { value: number }) => (
  <div className="relative h-4 w-full rounded-full bg-gray-200">
    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${value}%` }} />
  </div>
);

// 维度名称映射
const DIMENSION_NAMES: Record<string, string> = {
  clarity: '清晰度',
  specificity: '特异性',
  structure: '结构性',
  completeness: '完整性',
  tone: '语气适配',
  constraints: '约束性'
};

export default function EvaluateMode() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("deepseek");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!prompt.trim()) return;
    
    setIsEvaluating(true);
    setError(null);
    
    try {
      const response = await evaluatePrompt({ 
        prompt, 
        context: 'general',
        model: selectedModel  // 新增：传递选中的模型
      });
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '评估失败，请检查模型配置');
      console.error('评估错误:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // 将10分制转换为100分制用于显示
  const to100Scale = (score: number) => Math.round(score * 10);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">提示词质量评估（LLM驱动）</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>输入提示词</CardTitle></CardHeader>
          <CardContent>
            {/* 新增：模型选择器 */}
            <div className="mb-4">
              <ModelSelector 
                value={selectedModel} 
                onChange={setSelectedModel} 
                label="选择评估模型"
              />
            </div>
            
            <Textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="在此粘贴提示词，LLM将对其进行多维度专业评估..." 
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">{prompt.length} 字符</span>
              <Button onClick={handleEvaluate} disabled={isEvaluating || !prompt.trim()}>
                {isEvaluating ? `${selectedModel === 'deepseek' ? 'DeepSeek' : selectedModel === 'qwen' ? 'Qwen' : 'LLM'}评估中...` : '开始评估'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          {error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-red-600 text-center">
                  <p className="font-semibold">评估失败</p>
                  <p className="text-sm mt-2">{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">综合评分（{selectedModel === 'deepseek' ? 'DeepSeek' : selectedModel === 'qwen' ? 'Qwen' : 'LLM'}评估）</h3>
                  <span className="text-4xl font-bold text-blue-600">{to100Scale(result.overallScore)}</span>
                </div>
                <Progress value={to100Scale(result.overallScore)} />
                <p className="mt-4 text-sm text-gray-600">{result.summary}</p>
                
                {result.prioritizedImprovements.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="font-semibold text-amber-800 text-sm mb-2">优先改进：</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {result.prioritizedImprovements.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {result.dimensionScores.map((dim) => (
                    <div key={dim.dimension} className="border-b pb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{DIMENSION_NAMES[dim.dimension] || dim.dimension}</span>
                        <span className="font-bold text-sm">{to100Scale(dim.score)}/100</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{dim.feedback}</p>
                      {dim.suggestions.length > 0 && (
                        <ul className="text-xs text-amber-600 space-y-0.5">
                          {dim.suggestions.slice(0, 2).map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <p>输入提示词并点击开始评估</p>
                <p className="text-sm mt-2">将由LLM进行专业多维度分析</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}