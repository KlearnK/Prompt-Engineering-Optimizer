import axios from 'axios';

// 使用process.env而非import.meta.env以兼容V05配置
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

export interface CoTEvaluationParams {
  prompt: string;
  model?: string;
}

export interface CoTEvaluationResult {
  success: boolean;
  data?: {
    overallScore: number;
    dimensionEvaluations: Array<{
      dimension: string;
      key: string;
      score: number;
      reasoning: string;
      suggestions: string[];
      examples: {
        good?: string;
        bad?: string;
      };
    }>;
    summary: string;
    priorityImprovements: string[];
    fullReasoningChain: string;
    metadata: {
      model: string;
      timestamp: string;
      version: string;
    };
  };
  error?: string;
  meta?: {
    duration: string;
    timestamp: string;
  };
}

/**
 * CoT增强评估API
 */
export const cotEvaluatePrompt = async (
  params: CoTEvaluationParams
): Promise<CoTEvaluationResult['data']> => {
  const response = await axios.post<CoTEvaluationResult>(
    `${API_BASE_URL}/api/evaluate-cot`,
    params,
    {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Evaluation failed');
  }

  return response.data.data;
};

/**
 * 获取评估维度定义
 */
export const getEvaluationDimensions = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/evaluate-cot/dimensions`);
  return response.data.data;
};