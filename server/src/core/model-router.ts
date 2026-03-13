import axios from 'axios';

export interface ModelConfig {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

const models: Record<string, ModelConfig> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek-V3',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    maxTokens: 4000,
    temperature: 0.7
  }
  // Qwen 和 OpenAI 暂时注释掉，等你有 API Key 后再添加
  /*
  qwen: {
    id: 'qwen',
    name: 'Qwen-Max',
    baseURL: 'https://dashscope.aliyuncs.com/api/v1',
    apiKey: process.env.QWEN_API_KEY || '',
    model: 'qwen-max',
    maxTokens: 4000,
    temperature: 0.7
  },
  openai: {
    id: 'openai',
    name: 'GPT-4',
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.7
  }
  */
};

export async function callModel(
  modelId: string, 
  messages: any[], 
  options?: Partial<ModelConfig>
) {
  const config = models[modelId];
  if (!config) throw new Error(`Unknown model: ${modelId}`);
  
  if (!config.apiKey) {
    throw new Error(`API Key not configured for model: ${modelId}`);
  }

  const response = await axios.post(
    `${config.baseURL}/chat/completions`,
    {
      model: config.model,
      messages,
      max_tokens: options?.maxTokens || config.maxTokens,
      temperature: options?.temperature || config.temperature
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );

  return {
    content: response.data.choices[0].message.content,
    usage: response.data.usage,
    model: modelId
  };
}

export function getAvailableModels() {
  return Object.values(models)
    .filter(m => m.apiKey) // 只返回有 API Key 的模型
    .map(m => ({
      id: m.id,
      name: m.name
    }));
}
