import { useNavigate } from 'react-router-dom'
import { Shield, RefreshCw } from 'lucide-react'

export function ModeSelector() {
  const navigate = useNavigate()

  const modes = [
    {
      id: 'evaluate',
      title: '评估模式',
      subtitle: 'Google 6条原则检查',
      description: '基于清晰度、具体性、角色设定等6个维度，全面评估你的提示词质量',
      icon: Shield,
      color: 'bg-blue-500',
      path: '/evaluate'
    },
    {
      id: 'iterate',
      title: '迭代模式',
      subtitle: '递归优化 + A/B对比',
      description: '通过多轮反馈逐步优化提示词，支持版本对比选择最佳效果',
      icon: RefreshCw,
      color: 'bg-green-500',
      path: '/iterate'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PromptCraft V5
          </h1>
          <p className="text-lg text-gray-600">
            选择工作模式，开始优化你的提示词
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => navigate(mode.path)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-gray-200"
            >
              <div className={`${mode.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <mode.icon className="w-7 h-7 text-white" />
              </div>
              
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {mode.subtitle}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {mode.title}
              </h2>
              
              <p className="text-gray-600 leading-relaxed">
                {mode.description}
              </p>

              <div className="mt-6 flex items-center text-sm font-medium text-gray-900 group-hover:translate-x-2 transition-transform">
                进入模式 →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
