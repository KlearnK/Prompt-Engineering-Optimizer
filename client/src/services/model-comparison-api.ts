import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// 类型定义
export type ComparisonModel = 'deepseek-v3' | 'qwen-max' | 'glm-4' | 'gpt-4';
export type VotingStrategy = 'majority' | 'llm-judge' | 'hybrid';
export type TaskType = 'optimization' | 'evaluation';

export interface ModelResult {
  model: ComparisonModel;
  modelName: string;
  output: string;
  latency: number;
  tokenCount?: number;
  error?: string;
}

export interface Cluster {
  id: number;
  representative: string;
  members: ComparisonModel[];
  similarity: number;
}

export interface VotingResult {
  strategy: VotingStrategy;
  clusters: Cluster[];
  winner: ComparisonModel | null;
  consistencyScore: number;
  judgeReasoning?: string;
}

export interface ComparisonResponse {
  results: ModelResult[];
  voting: VotingResult;
  bestOutput: string | null;
  totalLatency: number;
}

export interface QuickComparisonResponse {
  winner: ComparisonModel | null;
  bestOutput: string | null;
  consistencyScore: number;
  modelCount: number;
  totalLatency: number;
}

export interface ModelInfo {
  id: ComparisonModel;
  name: string;
  provider: string;
}

export interface StrategyInfo {
  id: VotingStrategy;
  name: string;
  description: string;
}

export interface TaskTypeInfo {
  id: TaskType;
  name: string;
  description: string;
}

export interface ModelsInfoResponse {
  models: ModelInfo[];
  votingStrategies: StrategyInfo[];
  taskTypes: TaskTypeInfo[];
}

/**
 * 执行完整多模型对比
 */
export async function compareModels(
  prompt: string,
  taskType: TaskType = 'optimization',
  votingStrategy: VotingStrategy = 'hybrid',
  preferredModel?: string,  // 新增：用户偏好的基准模型
  apiKeys?: Record<string, string>
): Promise<ComparisonResponse> {
  const response = await axios.post(`${API_BASE_URL}/compare-models`, {
    prompt,
    taskType,
    votingStrategy,
    preferredModel,  // 新增：传递给后端
    apiKeys,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || '对比请求失败');
  }
  
  return response.data.data;
}

/**
 * 快速对比（简化返回）
 */
export async function quickCompare(
  prompt: string,
  taskType: TaskType = 'optimization'
): Promise<QuickComparisonResponse> {
  const response = await axios.post(`${API_BASE_URL}/compare-models/quick`, {
    prompt,
    taskType,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || '快速对比失败');
  }
  
  return response.data.data;
}

/**
 * 获取支持的模型和策略信息
 */
export async function getModelsInfo(): Promise<ModelsInfoResponse> {
  const response = await axios.get(`${API_BASE_URL}/compare-models/models`);
  
  if (!response.data.success) {
    throw new Error(response.data.error || '获取模型信息失败');
  }
  
  return response.data.data;
}

/**
 * 获取获胜模型的显示名称
 */
export function getWinnerName(winner: ComparisonModel | null): string {
  if (!winner) return '无获胜者';
  
  const names: Record<ComparisonModel, string> = {
    'deepseek-v3': 'DeepSeek-V3',
    'qwen-max': 'Qwen-Max',
    'glm-4': 'GLM-4',
    'gpt-4': 'GPT-4',
  };
  
  return names[winner] || winner;
}

/**
 * 获取一致性评分的评级文字
 */
export function getConsistencyRating(score: number): string {
  if (score >= 0.8) return '高度一致';
  if (score >= 0.6) return '基本一致';
  if (score >= 0.4) return '部分一致';
  return '分歧较大';
}

/**
 * 获取一致性评分的颜色类名
 */
export function getConsistencyColor(score: number): string {
  if (score >= 0.8) return 'text-green-600 bg-green-50';
  if (score >= 0.6) return 'text-blue-600 bg-blue-50';
  if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}