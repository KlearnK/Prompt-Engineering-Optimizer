import { useState } from 'react'
import { MessageSquare, Sparkles } from 'lucide-react'

interface IterationStep {
  version: number
  prompt: string
  feedback?: string
  timestamp: number
}

interface Props {
  history: IterationStep[]
  // currentPrompt 暂时未使用，标记为可选
  currentPrompt?: string
  feedback: string
  onFeedbackChange: (value: string) => void
  onIterate: () => void
  loading: boolean
}

export function IterationPanel({
  history,
  feedback,
  onFeedbackChange,
  onIterate,
  loading
}: Props) {
  const [selectedVersion, setSelectedVersion] = useState<number>(history.length)

  const selectedStep = history.find(s => s.version === selectedVersion) || history[history.length - 1]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {history.map((step) => (
            <button
              key={step.version}
              onClick={() => setSelectedVersion(step.version)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedVersion === step.version
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              V{step.version}
              {step.feedback && <span className="ml-1 text-xs">💬</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            版本 {selectedStep.version}
            {selectedStep.version === history.length && (
              <span className="ml-2 text-sm font-normal text-green-600">(当前)</span>
            )}
          </h3>
          <span className="text-sm text-gray-500">
            {new Date(selectedStep.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {selectedStep.feedback && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <MessageSquare className="w-4 h-4" />
              你的反馈
            </div>
            <p className="text-blue-900">{selectedStep.feedback}</p>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm">
          {selectedStep.prompt}
        </div>
      </div>

      {selectedVersion === history.length && (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-green-100">
          <div className="flex items-center gap-2 text-green-800 font-medium mb-4">
            <Sparkles className="w-5 h-5" />
            继续优化
          </div>
          
          <textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="告诉AI如何改进：'太长了，精简一点'、'增加一个约束条件'、'换个更专业的角色'..."
            className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-4"
          />
          
          <button
            onClick={onIterate}
            disabled={loading || !feedback.trim()}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '优化中...' : '生成下一版本'}
          </button>
        </div>
      )}
    </div>
  )
}
