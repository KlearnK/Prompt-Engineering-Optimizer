const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export interface EvaluationRequest {
  prompt: string;
  context?: string;
  model?: string;  // 新增：模型选择
}

export interface EvaluationResponse {
  success: boolean;
  data: {
    overallScore: number;
    dimensionScores: Array<{
      dimension: string;
      score: number;
      feedback: string;
      suggestions: string[];
      examples?: string[];
    }>;
    summary: string;
    prioritizedImprovements: string[];
    techniqueRecommendations: string[];
  };
  meta: {
    modelsUsed: string[];
    timestamp: string;
  };
}

export interface IterationRequest {
  currentPrompt: string;
  strategyId: string;
  evaluationFeedback?: string;
  iterationHistory?: string[];
  goal?: string;
  model?: string;  // 新增：模型选择
}

export interface IterationResponse {
  success: boolean;
  data: {
    originalPrompt: string;
    optimizedPrompt: string;
    changes: Array<{
      type: 'add' | 'remove' | 'modify' | 'restructure';
      description: string;
      rationale: string;
    }>;
    appliedTechniques: string[];
    expectedImprovements: string[];
    nextIterationSuggestions: string[];
  };
  meta: {
    strategyUsed: any;
    modelsUsed: string[];
    timestamp: string;
  };
}

export async function evaluatePrompt(request: EvaluationRequest): Promise<EvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '评估失败');
  }

  return response.json();
}

export async function iteratePrompt(request: IterationRequest): Promise<IterationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/iterate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '迭代失败');
  }

  return response.json();
}

export async function getStrategies(): Promise<{ strategies: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/strategies`);
  
  if (!response.ok) {
    throw new Error('获取策略列表失败');
  }

  return response.json();
}