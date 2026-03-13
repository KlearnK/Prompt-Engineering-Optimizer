import { useState, useEffect } from 'react'
import { ModelSelector } from '../components/ModelSelector'
import { getStrategies, iteratePrompt } from '@/services/optimization-api'

interface IterationStep {
  version: number
  prompt: string
  changes?: Array<{ type: string; description: string; rationale: string }>
  timestamp: number
}

// 新的策略类型，从后端API获取
interface Strategy {
  id: string
  name: string
  description: string
  applicableDimensions: string[]
  intensity: 'light' | 'moderate' | 'aggressive'
}

const GUIDE_STEPS = [
  {
    title: "什么是LLM迭代优化？",
    content: "系统调用LLM自动分析提示词，识别改进点，生成专业优化版本。你可以基于优化版本继续迭代，直到满意。",
    icon: "🔄"
  },
  {
    title: "如何使用？",
    content: "1. 输入初始提示词 2. 选择优化策略（清晰度、结构等） 3. 查看LLM优化结果 4. 点击'继续优化'进行下一轮迭代",
    icon: "📝"
  },
  {
    title: "优化策略说明",
    content: "清晰度增强消除歧义，结构优化重组逻辑，上下文丰富补充信息，约束强化明确边界，语气调整适配场景。",
    icon: "🎯"
  }
]

export function IterateMode() {
  const [step, setStep] = useState<'input' | 'strategy' | 'iterating'>('input')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [model, setModel] = useState('deepseek')
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [history, setHistory] = useState<IterationStep[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [iteration, setIteration] = useState(1)
  const [evaluationFeedback, setEvaluationFeedback] = useState('')

  // 加载策略列表
  useEffect(() => {
    getStrategies()
      .then(data => {
        setStrategies(data.strategies)
        if (data.strategies.length > 0) {
          setSelectedStrategy(data.strategies[0].id)
        }
      })
      .catch(err => console.error('加载策略失败:', err))
  }, [])

  const startIteration = () => {
    if (!originalPrompt.trim()) return
    setStep('strategy')
  }

  const runOptimization = async () => {
    setLoading(true)
    try {
      const response = await iteratePrompt({
        currentPrompt: originalPrompt,
        strategyId: selectedStrategy,
        evaluationFeedback: '',
        iterationHistory: [],
        goal: '提升提示词整体质量'
      })
      
      if (response.success) {
        const data = response.data
        setCurrentPrompt(data.optimizedPrompt)
        setHistory([{
          version: 1,
          prompt: data.optimizedPrompt,
          changes: data.changes,
          timestamp: Date.now()
        }])
        // 保存评估反馈供下一轮使用
        setEvaluationFeedback(data.expectedImprovements.join('\n'))
        setIteration(2)
        setStep('iterating')
      }
    } catch (error: any) {
      alert('优化失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!currentPrompt.trim()) return
    
    setLoading(true)
    try {
      const response = await iteratePrompt({
        currentPrompt: currentPrompt,
        strategyId: selectedStrategy,
        evaluationFeedback: evaluationFeedback,
        iterationHistory: history.map(h => `版本${h.version}: ${h.prompt.substring(0, 100)}...`),
        goal: '继续提升提示词质量'
      })
      
      if (response.success) {
        const data = response.data
        setCurrentPrompt(data.optimizedPrompt)
        setHistory([...history, {
          version: iteration,
          prompt: data.optimizedPrompt,
          changes: data.changes,
          timestamp: Date.now()
        }])
        setEvaluationFeedback(data.expectedImprovements.join('\n'))
        setIteration(iteration + 1)
      }
    } catch (error: any) {
      alert('优化失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    navigator.clipboard.writeText(currentPrompt)
    alert('已复制到剪贴板')
  }

  const reset = () => {
    setStep('input')
    setOriginalPrompt('')
    setCurrentPrompt('')
    setHistory([])
    setIteration(1)
    setEvaluationFeedback('')
  }

  // 步骤 1: 输入初始提示词
  if (step === 'input') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">LLM迭代模式</h2>
          <p className="text-gray-600">调用大模型进行专业提示词优化，多轮迭代打磨完美提示词</p>
        </div>

        {/* 使用引导 */}
        <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">使用指南</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {GUIDE_STEPS.map((guide, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">{guide.icon}</div>
                <h4 className="font-medium text-gray-900 mb-1">{guide.title}</h4>
                <p className="text-sm text-gray-600">{guide.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择模型
            </label>
            <ModelSelector value={model} onChange={setModel} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              初始提示词（简单描述即可，LLM会帮你扩展优化）
            </label>
            <textarea
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder="例如：帮我写一个能分析销售数据的AI助手..."
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={startIteration}
            disabled={!originalPrompt.trim()}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            下一步：选择优化策略 →
          </button>
        </div>
      </div>
    )
  }

  // 步骤 2: 选择优化策略
  if (step === 'strategy') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">选择LLM优化策略</h2>
          <p className="text-gray-600">根据你的需求选择最适合的优化方向</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  strategy.intensity === 'aggressive' ? 'bg-red-100 text-red-700' :
                  strategy.intensity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {strategy.intensity === 'aggressive' ? '深度' : 
                   strategy.intensity === 'moderate' ? '中等' : '轻度'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{strategy.description}</p>
              <p className="text-xs text-gray-400">
                适用: {strategy.applicableDimensions.join(', ')}
              </p>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('input')}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            ← 返回修改
          </button>
          <button
            onClick={runOptimization}
            disabled={loading || !selectedStrategy}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                LLM优化中...
              </>
            ) : (
              '开始LLM优化'
            )}
          </button>
        </div>
      </div>
    )
  }

  // 步骤 3: 迭代优化中
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">LLM迭代优化中</h2>
          <p className="text-gray-600">
            当前版本 V{history.length} · 已迭代 {history.length - 1} 次 · 
            策略: {strategies.find(s => s.id === selectedStrategy)?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            重新开始
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            导出最终版
          </button>
        </div>
      </div>

      {/* 历史版本 */}
      <div className="mb-6 space-y-4">
        {history.map((h, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">版本 {h.version}</span>
              <span className="text-xs text-gray-400">
                {new Date(h.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap text-sm mb-2">{h.prompt}</div>
            {h.changes && h.changes.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-500">本次改动：</p>
                {h.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${
                      change.type === 'add' ? 'bg-green-100 text-green-700' :
                      change.type === 'remove' ? 'bg-red-100 text-red-700' :
                      change.type === 'modify' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {change.type === 'add' ? '新增' :
                       change.type === 'remove' ? '删除' :
                       change.type === 'modify' ? '修改' : '重构'}
                    </span>
                    <span className="text-gray-600">{change.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 当前版本 */}
      <div className="bg-white border-2 border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">当前版本（可编辑）</h3>
          <span className="text-sm text-green-600 font-medium">最新</span>
        </div>
        <textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* 继续优化 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">✨ 继续LLM优化</h3>
        <p className="text-gray-600 text-sm mb-4">对当前版本不满意？点击继续优化生成下一个版本</p>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              LLM优化中...
            </>
          ) : (
            '继续优化 →'
          )}
        </button>
      </div>
    </div>
  )
}