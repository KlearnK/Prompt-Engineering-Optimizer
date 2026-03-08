import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModelConfig } from '@/contexts/ModelConfigContext';
import { Settings } from 'lucide-react';

const providers = [
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
  { id: 'qwen', name: '通义千问', models: ['qwen-turbo', 'qwen-plus'] },
  { id: 'zhipu', name: '智谱AI', models: ['glm-4', 'glm-3-turbo'] },
];

const ModelConfigDialog: React.FC = () => {
  const { config, setConfig, isConfigured } = useModelConfig();
  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    setConfig(localConfig);
    setOpen(false);
  };

  const selectedProvider = providers.find(p => p.id === localConfig.provider);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          {isConfigured ? '更换模型' : '配置 API'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>配置 AI 模型</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">模型提供商</label>
            <Select
              value={localConfig.provider}
              onValueChange={(v: any) => {
                const provider = providers.find(p => p.id === v);
                setLocalConfig({
                  ...localConfig,
                  provider: v,
                  model: provider?.models[0] || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">模型</label>
            <Select
              value={localConfig.model}
              onValueChange={(v) => setLocalConfig({ ...localConfig, model: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider?.models.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              API Key 仅存储在本地浏览器中，不会上传到服务器
            </p>
          </div>

          <Button onClick={handleSave} className="w-full">
            保存配置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelConfigDialog;
