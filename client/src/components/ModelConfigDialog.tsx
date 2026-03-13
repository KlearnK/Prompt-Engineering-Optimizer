import { useState } from 'react';
import { useModelConfig } from '../contexts/ModelConfigContext';
import { Settings, X } from 'lucide-react';

const providers = [
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
  { id: 'qwen', name: '通义千问', models: ['qwen-turbo', 'qwen-plus'] },
  { id: 'zhipu', name: '智谱AI', models: ['glm-4', 'glm-3-turbo'] },
];

export default function ModelConfigDialog() {
  const { config, setConfig, isConfigured } = useModelConfig();
  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    setConfig(localConfig);
    setOpen(false);
  };

  const selectedProvider = providers.find(p => p.id === localConfig.provider);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <Settings className="w-4 h-4" />
        {isConfigured ? '更换模型' : '配置 API'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">配置 AI 模型</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 提供商选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型提供商
            </label>
            <select
              value={localConfig.provider}
              onChange={(e) => {
                const provider = providers.find(p => p.id === e.target.value);
                setLocalConfig({
                  ...localConfig,
                  provider: e.target.value as any,
                  model: provider?.models[0] || '',
                });
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型
            </label>
            <select
              value={localConfig.model}
              onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {selectedProvider?.models.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              API Key 仅存储在本地浏览器中，不会上传到服务器
            </p>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
