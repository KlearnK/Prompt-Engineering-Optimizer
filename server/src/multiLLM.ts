export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
  // ReAct 专用参数
  isReAct?: boolean;           // 是否为 ReAct 模式
  reasoningSteps?: number;     // 预期推理步骤数
  isEvaluation?: boolean;      // 是否为评估模式（6维评估）
}

export interface LLMResponse {
  provider: string;
  content: string | null;
  error?: string;
}

// 基础超时配置（毫秒）- 针对单次调用
const BASE_TIMEOUTS: Record<string, number> = {
  deepseek: 90000,     // DeepSeek 单次 90s（ReAct 推理需要更长时间）
  qwen: 45000,         // Qwen 单次 45s（国内稳定，可短一些）
  openai: 60000,       // OpenAI 单次 60s
  siliconflow: 60000,  // SiliconFlow 单次 60s
};

// 评估模式额外超时（6维评估需要更长时间）
const EVAL_EXTRA_TIMEOUT = 30000;  // 评估 +30s

// ReAct 步长调整（每步增加的复杂度）
const REACT_COMPLEXITY_FACTOR: Record<string, number> = {
  deepseek: 1.5,   // DeepSeek 推理慢，系数高
  qwen: 1.0,       // Qwen 正常
  openai: 1.0,
  siliconflow: 1.0,
};

// 最大重试次数
const MAX_RETRIES = 1;

// 根据请求计算动态超时
function calculateTimeout(provider: string, request: LLMRequest): number {
  let baseTimeout = BASE_TIMEOUTS[provider] || 60000;
  
  // ReAct 模式增加基础时间
  if (request.isReAct) {
    baseTimeout *= 1.2; // ReAct 基础增加 20%
  }
  
  // 评估模式额外增加
  if (request.isEvaluation) {
    baseTimeout += EVAL_EXTRA_TIMEOUT;
  }
  
  // 根据推理步骤调整（如果指定）
  if (request.reasoningSteps && request.reasoningSteps > 3) {
    const factor = REACT_COMPLEXITY_FACTOR[provider] || 1.0;
    baseTimeout += (request.reasoningSteps - 3) * 15000 * factor;
  }
  
  // 限制最大 120s（避免单请求过度等待）
  return Math.min(baseTimeout, 120000);
}

// 带超时的 fetch 封装
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const elapsed = Date.now() - startTime;
    console.log(`[fetch] ${elapsed}ms used (limit: ${timeoutMs}ms)`);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: ${timeoutMs}ms exceeded (elapsed: ${elapsed}ms)`);
    }
    throw error;
  }
}

// 带重试的 LLM 调用
async function callSingleLLMWithRetry(
  request: LLMRequest,
  config: { provider: string; model: string; apiKey: string; baseUrl?: string },
  retryCount: number = 0
): Promise<string> {
  const baseUrls: Record<string, string> = {
    deepseek: 'https://api.deepseek.com',
    openai: 'https://api.openai.com',
    siliconflow: 'https://api.siliconflow.cn',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  };
  
  const baseUrl = config.baseUrl || baseUrls[config.provider] || baseUrls.deepseek;
  
  // API 路径处理
  let apiUrl: string;
  if (config.provider === 'qwen') {
    apiUrl = `${baseUrl}/chat/completions`;
  } else {
    apiUrl = `${baseUrl}/v1/chat/completions`;
  }
  
  // 计算动态超时
  const timeout = calculateTimeout(config.provider, request);
  
  console.log(`[${config.provider}] Calling ${config.model}`, {
    isReAct: request.isReAct || false,
    isEvaluation: request.isEvaluation || false,
    timeout: `${timeout}ms`,
    retry: retryCount
  });
  
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.3,
          max_tokens: request.max_tokens ?? 2000,
          response_format: request.response_format
        })
      },
      timeout
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json() as any;
    const content = data.choices[0]?.message?.content || '';
    
    console.log(`[${config.provider}] Success, tokens: ${data.usage?.total_tokens || '?'}`);
    return content;
    
  } catch (error) {
    console.error(`[${config.provider}] Error:`, error instanceof Error ? error.message : error);
    
    // 智能重试
    if (retryCount < MAX_RETRIES && error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      const isTimeout = errorMsg.includes('timeout');
      const isNetworkError = errorMsg.includes('fetch failed') || errorMsg.includes('econnrefused');
      
      if (isTimeout || isNetworkError) {
        console.log(`[${config.provider}] Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        // 重试时增加超时时间
        const retryRequest = {
          ...request,
          reasoningSteps: (request.reasoningSteps || 3) + 2
        };
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callSingleLLMWithRetry(retryRequest, config, retryCount + 1);
      }
    }
    
    throw error;
  }
}

// 主调用函数
export async function callMultipleLLMs(
  request: LLMRequest,
  modelConfigs: Array<{ provider: string; model: string; apiKey: string; baseUrl?: string }>
): Promise<LLMResponse[]> {
  const promises = modelConfigs.map(async (config) => {
    try {
      const content = await callSingleLLMWithRetry(request, config);
      return { provider: config.provider, content };
    } catch (error) {
      console.error(`[${config.provider}] Final error:`, error);
      return { 
        provider: config.provider, 
        content: null, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
  
  return await Promise.all(promises);
}

// 单个模型调用
export async function callSingleLLM(
  request: LLMRequest,
  config: { provider: string; model: string; apiKey: string; baseUrl?: string }
): Promise<string> {
  return callSingleLLMWithRetry(request, config);
}

// ReAct 专用：单次轮次调用
export async function callLLMForReActRound(
  messages: Array<{ role: string; content: string }>,
  config: { provider: string; model: string; apiKey: string; baseUrl?: string },
  roundType: 'thought' | 'action' | 'observation',
  roundNum: number
): Promise<string> {
  const request: LLMRequest = {
    messages,
    temperature: 0.2,
    isReAct: true,
    reasoningSteps: roundType === 'thought' ? 4 : 2, // thought 阶段需要更多步数
    max_tokens: roundType === 'thought' ? 2000 : 1000,
  };
  
  console.log(`[ReAct Round ${roundNum}] ${roundType} with ${config.provider}`);
  return callSingleLLMWithRetry(request, config);
}

// 评估专用：6维评估调用
export async function callLLMForEvaluation(
  messages: Array<{ role: string; content: string }>,
  config: { provider: string; model: string; apiKey: string; baseUrl?: string },
  dimension: string
): Promise<string> {
  const request: LLMRequest = {
    messages,
    temperature: 0.2,
    isEvaluation: true,
    max_tokens: 1500,
  };
  
  console.log(`[CoT Evaluation] ${dimension} with ${config.provider}`);
  return callSingleLLMWithRetry(request, config);
}