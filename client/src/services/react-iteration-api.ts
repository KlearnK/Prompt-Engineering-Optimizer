import axios from 'axios';

// 使用硬编码URL避免process问题
const API_BASE_URL = 'http://localhost:3001';

export interface ReactIterationParams {
  prompt: string;
  strategy?: string;
  model?: string;
}

export const reactIteratePrompt = async (params: ReactIterationParams) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/iterate-react`,
    params,
    {
      timeout: 300000,
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Iteration failed');
  }
  
  return response.data.data;
};