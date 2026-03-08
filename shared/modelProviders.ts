/**
 * Multi-model provider configuration for PromptCraft
 * Supports: DeepSeek, Qwen (Alibaba), ZhipuAI (GLM), OpenAI
 * All providers use OpenAI-compatible chat completions API
 */

export type ModelProvider = "deepseek" | "qwen" | "zhipu" | "openai";

export interface ProviderConfig {
  id: ModelProvider;
  name: string;
  nameZh: string;
  description: string;
  baseUrl: string;
  models: ModelOption[];
  apiKeyPlaceholder: string;
  apiKeyUrl: string;
  apiKeyUrlLabel: string;
  recommended: boolean;
  cnFriendly: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  recommended?: boolean;
}

export const PROVIDER_CONFIGS: Record<ModelProvider, ProviderConfig> = {
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    nameZh: "DeepSeek（深度求索）",
    description: "国产顶级大模型，性价比极高，推理能力强",
    baseUrl: "https://api.deepseek.com",
    apiKeyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    apiKeyUrlLabel: "获取 DeepSeek API Key",
    recommended: true,
    cnFriendly: true,
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek-V3",
        description: "最新旗舰对话模型，综合能力强",
        contextWindow: 64000,
        recommended: true,
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek-R1",
        description: "强化推理模型，适合复杂分析任务",
        contextWindow: 64000,
      },
    ],
  },
  qwen: {
    id: "qwen",
    name: "通义千问",
    nameZh: "通义千问（阿里云）",
    description: "阿里云旗舰大模型，中文理解能力出色",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKeyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    apiKeyUrl: "https://bailian.console.aliyun.com/?apiKey=1",
    apiKeyUrlLabel: "获取通义千问 API Key",
    recommended: true,
    cnFriendly: true,
    models: [
      {
        id: "qwen-plus",
        name: "Qwen-Plus",
        description: "均衡性能与成本，适合日常使用",
        contextWindow: 131072,
        recommended: true,
      },
      {
        id: "qwen-turbo",
        name: "Qwen-Turbo",
        description: "快速响应，低成本",
        contextWindow: 131072,
      },
      {
        id: "qwen-max",
        name: "Qwen-Max",
        description: "最强旗舰模型，效果最佳",
        contextWindow: 32768,
      },
    ],
  },
  zhipu: {
    id: "zhipu",
    name: "智谱 AI",
    nameZh: "智谱 AI（GLM）",
    description: "清华系大模型，中文能力优秀",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    apiKeyPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    apiKeyUrlLabel: "获取智谱 AI API Key",
    recommended: false,
    cnFriendly: true,
    models: [
      {
        id: "glm-4-flash",
        name: "GLM-4-Flash",
        description: "免费快速模型，适合轻量任务",
        contextWindow: 128000,
        recommended: true,
      },
      {
        id: "glm-4-plus",
        name: "GLM-4-Plus",
        description: "高性能旗舰模型",
        contextWindow: 128000,
      },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    nameZh: "OpenAI（ChatGPT）",
    description: "GPT 系列模型，需要科学上网",
    baseUrl: "https://api.openai.com/v1",
    apiKeyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    apiKeyUrlLabel: "获取 OpenAI API Key",
    recommended: false,
    cnFriendly: false,
    models: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "经济实惠的高性能模型",
        contextWindow: 128000,
        recommended: true,
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "旗舰多模态模型",
        contextWindow: 128000,
      },
    ],
  },
};

export const DEFAULT_PROVIDER: ModelProvider = "deepseek";
export const DEFAULT_MODEL = "deepseek-chat";

export interface UserModelConfig {
  provider: ModelProvider;
  modelId: string;
  apiKey: string;
}
