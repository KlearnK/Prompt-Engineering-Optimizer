import axios from 'axios';

// 修复：避免使用import.meta.env，使用兼容写法
declare const process: {
  env: {
    VITE_API_URL?: string;
    NODE_ENV?: string;
  };
};

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.VITE_API_URL) 
  ? process.env.VITE_API_URL 
  : 'http://localhost:3001';

export interface EvaluationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface IterationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const evaluatePrompt = async (prompt: string, model?: string): Promise<EvaluationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/optimize/evaluate`, {
      prompt,
      model
    });
    return response.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'Evaluation failed'
    };
  }
};

export const iteratePrompt = async (prompt: string, strategy?: string, model?: string): Promise<IterationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/optimize/iterate`, {
      prompt,
      strategy,
      model
    });
    return response.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'Iteration failed'
    };
  }
};

export const getStrategies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/optimize/strategies`);
    return response.data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      strategies: []
    };
  }
};