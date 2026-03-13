import { useState } from 'react'
import { CheckCircle, Lightbulb, Copy, Award } from 'lucide-react'

interface Props {
  result: {
    totalScore: number
    maxScore: number
    criteria: Array<{
      name: string
      score: number
      feedback: string
    }>
    summary: string
    suggestions: string[]
  }
  originalPrompt: string
}

export function EvaluationReport({ result, originalPrompt }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(originalPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6 mt-8">
      {/* 总分卡片 */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">评估结果</h3>
            <p className="text-gray-500">基于 Google 6 条最佳实践</p>
          </div>
          <div className={`px-6 py-4 rounded-xl border-2 ${getScoreColor(result.totalScore)}`}>
            <div className="text-4xl font-bold">{result.totalScore}</div>
            <div className="text-sm opacity-75">/ {result.maxScore} 分</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Award className={`w-6 h-6 ${result.totalScore >= 8 ? 'text-green-500' : result.totalScore >= 6 ? 'text-yellow-500' : 'text-red-500'}`} />
          <span className="text-lg font-medium text-gray-900">综合评价：{result.summary}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(result.totalScore)}`}
            style={{ width: `${(result.totalScore / result.maxScore) * 100}%` }}
          />
        </div>
      </div>

      {/* 各维度评分 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">各维度评分</h3>
        <div className="space-y-4">
          {result.criteria.map((criterion, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-700">{criterion.name}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(criterion.score)}`}
                      style={{ width: `${criterion.score * 10}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 ${criterion.score >= 7 ? 'text-green-600' : criterion.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {criterion.score}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{criterion.feedback}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 改进建议 */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow p-6 border border-yellow-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          改进建议
        </h3>
        <ul className="space-y-3">
          {result.suggestions.map((suggestion, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {idx + 1}
              </span>
              <span className="text-gray-800 pt-0.5">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 原始提示词 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            原始提示词
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            <Copy className="w-4 h-4" />
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
          {originalPrompt}
        </div>
      </div>
    </div>
  )
}
