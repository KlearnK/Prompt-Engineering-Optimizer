/**
 * Multi-provider LLM invocation helper
 * Supports: DeepSeek, Qwen (Alibaba DashScope), ZhipuAI (GLM), OpenAI
 * All providers use OpenAI-compatible chat completions API
 */

import type { Request } from "express";
import { PROVIDER_CONFIGS, type ModelProvider } from "../shared/modelProviders";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  messages: LLMMessage[];
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
  temperature?: number;
  max_tokens?: number;
}

export interface ModelRequestConfig {
  provider: ModelProvider;
  modelId: string;
  apiKey: string;
}

/**
 * 清洗 LLM 响应内容，提取 JSON
 * 处理 Markdown 代码块、多余文本等情况
 */
function cleanLLMResponse(rawContent: string): string {
  if (!rawContent) return "";
  
  const content = rawContent.trim();
  
  // 尝试提取 ```json ... ``` 或 ``` ... ``` 中的内容
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // 尝试查找第一个 { 和最后一个 } 之间的内容（JSON 对象）
  const jsonMatch = content.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // 尝试查找第一个 [ 和最后一个 ] 之间的内容（JSON 数组）
  const arrayMatch = content.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    return arrayMatch[1].trim();
  }
  
  // 如果都不匹配，返回原内容
  return content;
}

/**
 * Extract model config from request headers (sent by frontend)
 */
export function getModelConfigFromRequest(req: Request): ModelRequestConfig | null {
  const provider = req.headers["x-model-provider"] as string;
  const modelId = req.headers["x-model-id"] as string;
  const apiKey = req.headers["x-api-key"] as string;

  if (!provider || !modelId || !apiKey) return null;
  if (!PROVIDER_CONFIGS[provider as ModelProvider]) return null;

  return {
    provider: provider as ModelProvider,
    modelId,
    apiKey,
  };
}

/**
 * Invoke LLM using user-provided API key and model selection
 * Falls back to built-in LLM if no user config provided
 */
export async function invokeMultiLLM(
  options: LLMOptions,
  modelConfig: ModelRequestConfig
): Promise<{ choices: Array<{ message: { content: string } }> }> {
  const providerConfig = PROVIDER_CONFIGS[modelConfig.provider];
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${modelConfig.provider}`);
  }

  const baseUrl = providerConfig.baseUrl;
  const url = `${baseUrl}/chat/completions`;

  const body: Record<string, unknown> = {
    model: modelConfig.modelId,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
  };

  if (options.max_tokens) {
    body.max_tokens = options.max_tokens;
  }

  // Handle response_format - only OpenAI supports json_schema/json_object reliably
  // DeepSeek, Qwen, Zhipu do NOT support response_format parameter
  if (options.response_format && modelConfig.provider === "openai") {
    body.response_format = options.response_format;
  }
  // For non-OpenAI providers: rely on prompt engineering to enforce JSON output
  // Do NOT set response_format for DeepSeek/Qwen/Zhipu to avoid 500 errors

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    let errorMsg = `LLM API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson?.error?.message ?? errorJson?.message ?? errorMsg;
    } catch {
      errorMsg = errorText.slice(0, 200) || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  // 清洗响应内容，处理 Markdown JSON 代码块
  if (data.choices[0]?.message?.content) {
    data.choices[0].message.content = cleanLLMResponse(data.choices[0].message.content);
  }

  return data;
}

/**
 * Test connection to a provider with a minimal request
 */
export async function testProviderConnection(config: ModelRequestConfig): Promise<boolean> {
  try {
    const result = await invokeMultiLLM(
      {
        messages: [
          { role: "user", content: "Reply with just: OK" },
        ],
        max_tokens: 10,
      },
      config
    );
    const content = result.choices[0]?.message?.content ?? "";
    return content.length > 0;
  } catch {
    return false;
  }
}