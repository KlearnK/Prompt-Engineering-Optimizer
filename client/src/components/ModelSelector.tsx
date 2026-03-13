import { useState } from 'react'
import { useModelConfig } from '../contexts/ModelConfigContext'

interface Model {
  id: string
  name: string
  description: string
  disabled?: boolean
}

const AVAILABLE_MODELS: Model[] = [
  { id: 'deepseek', name: 'DeepSeek-V3', description: '深度思考，适合复杂推理' },
  { id: 'qwen', name: 'Qwen-Max', description: '中文优化，适合国内用户' },
  { id: 'glm', name: 'GLM-4', description: '智谱AI，长文本能力强（待配置）', disabled: true },
  { id: 'gpt4', name: 'GPT-4', description: 'OpenAI旗舰模型（待配置）', disabled: true }
]

interface Props {
  value?: string
  onChange?: (value: string) => void
  label?: string
}

export function ModelSelector({ value, onChange, label }: Props) {
  const { config } = useModelConfig()
  const [isOpen, setIsOpen] = useState(false)
  
  // 使用传入的值或配置中的模型
  const currentValue = value || config.provider
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === currentValue) || AVAILABLE_MODELS[0]

  const handleSelect = (modelId: string) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId)
    if (model?.disabled) {
      alert(`${model.name} 尚未配置 API Key，请先配置环境变量`)
      return
    }
    if (onChange) {
      onChange(modelId)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-left hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between"
      >
        <div>
          <div className="font-medium text-gray-900">{selectedModel.name}</div>
          <div className="text-sm text-gray-500">{selectedModel.description}</div>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {AVAILABLE_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                disabled={model.disabled}
                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                  currentValue === model.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                } ${model.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              >
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {model.name}
                  {model.disabled && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">未配置</span>}
                </div>
                <div className="text-sm text-gray-500">{model.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}