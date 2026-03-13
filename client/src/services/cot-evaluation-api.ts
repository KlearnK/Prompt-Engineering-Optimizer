import axios from 'axios';

// 使用硬编码URL避免import.meta.env问题
const API_BASE_URL = 'http://localhost:3001';

export const cotEvaluatePrompt = async (params: { prompt: string; model?: string }) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/evaluate-cot`,
    params,
    {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Evaluation failed');
  }
  
  return response.data.data;
};