// 简单的模型配置管理
export interface ModelConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

// 从环境变量获取活跃模型配置
export function getActiveModels(): ModelConfig[] {
  const models: ModelConfig[] = [];
  
  // DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    models.push({
      provider: 'deepseek',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    });
  }
  
  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    models.push({
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL
    });
  }
  
  // SiliconFlow
  if (process.env.SILICONFLOW_API_KEY) {
    models.push({
      provider: 'siliconflow',
      model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn'
    });
  }
  
  // Qwen - 阿里云DashScope，修复：使用正确的模型名称 qwen-plus
  if (process.env.QWEN_API_KEY) {
    models.push({
      provider: 'qwen',
      model: process.env.QWEN_MODEL || 'qwen-plus',  // 修复：qwen-max -> qwen-plus
      apiKey: process.env.QWEN_API_KEY,
      baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
  }
  
  return models;
}