import { callMultipleLLMs, LLMRequest } from '../multiLLM';
import { OptimizationTechnique } from '../shared/promptData';

export interface IterationStrategy {
  id: string;
  name: string;
  description: string;
  applicableDimensions: string[];
  intensity: 'light' | 'moderate' | 'aggressive';
}

export interface IterationResult {
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
}

const ITERATION_STRATEGIES: IterationStrategy[] = [
  {
    id: 'clarity_enhance',
    name: '清晰度增强',
    description: '消除歧义，明确指令',
    applicableDimensions: ['clarity', 'specificity'],
    intensity: 'moderate'
  },
  {
    id: 'structure_optimize',
    name: '结构优化',
    description: '重新组织逻辑层次，添加标记',
    applicableDimensions: ['structure'],
    intensity: 'moderate'
  },
  {
    id: 'context_enrich',
    name: '上下文丰富',
    description: '补充背景信息和示例',
    applicableDimensions: ['completeness', 'specificity'],
    intensity: 'aggressive'
  },
  {
    id: 'constraint_add',
    name: '约束强化',
    description: '添加输出格式和边界条件',
    applicableDimensions: ['constraints'],
    intensity: 'light'
  },
  {
    id: 'tone_adjust',
    name: '语气调整',
    description: '调整专业度和风格',
    applicableDimensions: ['tone'],
    intensity: 'light'
  }
];

// 生成策略描述（自然语言，不是 JSON）
const generateStrategyDescription = (strategy: IterationStrategy): string => {
  return `策略名称：${strategy.name}
策略描述：${strategy.description}
适用维度：${strategy.applicableDimensions.join('、')}
优化强度：${strategy.intensity === 'light' ? '轻度' : strategy.intensity === 'moderate' ? '中度' : '深度'}`;
};

const ITERATION_PROMPT_TEMPLATE = `你是一位专业的提示词优化工程师。请根据以下策略对提示词进行迭代优化。

【迭代策略】
{{strategy}}

【当前提示词】
{{currentPrompt}}

{{evaluationFeedback}}

{{iterationHistory}}

【目标】
{{goal}}

请按以下JSON格式返回优化结果（确保是有效的JSON）:
{
  "optimizedPrompt": "优化后的完整提示词...",
  "changes": [
    {
      "type": "add|remove|modify|restructure",
      "description": "具体改动描述",
      "rationale": "为什么这样改"
    }
  ],
  "appliedTechniques": ["使用的技巧ID"],
  "expectedImprovements": ["预期改进1", "预期改进2"],
  "nextIterationSuggestions": ["下一步可以优化xxx"]
}

要求：
1. 保持原始意图不变
2. 直接应用策略指定的改进
3. 提供具体可观察的改进点
4. 优化后的提示词必须完整可用
5. optimizedPrompt 字段必须是纯文本，不要包含 JSON 代码`;

// 模型配置（修复：标准化模型名称映射）
const getModelConfigs = (modelName: string) => {
  // 标准化模型名称
  const normalizedModel = modelName.toLowerCase();
  
  // 映射到正确的 API 模型名称
  const modelMapping: Record<string, { provider: string; model: string }> = {
    'deepseek': { provider: 'deepseek', model: 'deepseek-chat' },
    'deepseek-chat': { provider: 'deepseek', model: 'deepseek-chat' },
    'deepseek-v3': { provider: 'deepseek', model: 'deepseek-chat' },
    'qwen': { provider: 'qwen', model: 'qwen-plus' },
    'qwen-max': { provider: 'qwen', model: 'qwen-max' },
    'qwen-plus': { provider: 'qwen', model: 'qwen-plus' },
    'gpt4': { provider: 'openai', model: 'gpt-4' },
    'gpt-4': { provider: 'openai', model: 'gpt-4' },
  };
  
  const mapped = modelMapping[normalizedModel] || { provider: 'deepseek', model: 'deepseek-chat' };
  
  const configs = [];
  
  if (mapped.provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
    configs.push({
      provider: 'deepseek',
      model: mapped.model,
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    });
  } else if (mapped.provider === 'qwen' && process.env.QWEN_API_KEY) {
    configs.push({
      provider: 'qwen',
      model: mapped.model,
      apiKey: process.env.QWEN_API_KEY,
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
  } else if (mapped.provider === 'openai' && process.env.OPENAI_API_KEY) {
    configs.push({
      provider: 'openai',
      model: mapped.model,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL
    });
  }
  
  // 默认使用 DeepSeek
  if (configs.length === 0) {
    configs.push({
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: 'https://api.deepseek.com'
    });
  }
  
  return configs;
};

export async function iteratePromptWithLLM(
  currentPrompt: string,
  strategy: IterationStrategy,
  evaluationFeedback: string,
  iterationHistory: string[],
  goal: string,
  modelConfigs: Array<{ provider: string; model: string; apiKey: string }>
): Promise<IterationResult> {
  const strategyDesc = generateStrategyDescription(strategy);
  const feedbackSection = evaluationFeedback ? `【评估反馈】\n${evaluationFeedback}` : '';
  const historySection = iterationHistory.length > 0 ? `【优化历史】\n${iterationHistory.join('\n')}` : '';

  const iterationPrompt = ITERATION_PROMPT_TEMPLATE
    .replace('{{strategy}}', strategyDesc)
    .replace('{{currentPrompt}}', currentPrompt)
    .replace('{{evaluationFeedback}}', feedbackSection)
    .replace('{{iterationHistory}}', historySection)
    .replace('{{goal}}', goal);

  const request: LLMRequest = {
    messages: [
      { role: 'system', content: '你是一位专业的提示词优化工程师，擅长通过迭代改进提升提示词质量。保持JSON格式输出。' },
      { role: 'user', content: iterationPrompt }
    ],
    temperature: 0.4,
    max_tokens: 2500
  };

  try {
    const responses = await callMultipleLLMs(request, modelConfigs);
    
    for (const response of responses) {
      if (response.content) {
        try {
          // 尝试从文本中提取 JSON
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`无法从 ${response.provider} 的响应中提取 JSON`);
            continue;
          }
          
          const result = JSON.parse(jsonMatch[0]) as IterationResult;
          return validateAndNormalizeIteration(result, currentPrompt);
        } catch (e) {
          console.warn(`解析模型 ${response.provider} 的迭代结果失败:`, e);
          continue;
        }
      }
    }
    
    throw new Error('所有模型迭代失败');
  } catch (error) {
    console.error('LLM迭代服务错误:', error);
    return getDefaultIteration(currentPrompt);
  }
}

function validateAndNormalizeIteration(result: any, originalPrompt: string): IterationResult {
  // 清理 optimizedPrompt，确保是纯文本
  let optimizedPrompt = result.optimizedPrompt || originalPrompt;
  
  // 如果 optimizedPrompt 包含 JSON 代码块，尝试提取纯文本
  if (optimizedPrompt.includes('```json') || optimizedPrompt.includes('```')) {
    const codeBlockMatch = optimizedPrompt.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      optimizedPrompt = codeBlockMatch[1].trim();
    }
  }

  return {
    originalPrompt,
    optimizedPrompt: optimizedPrompt,
    changes: (result.changes || []).map((c: any) => ({
      type: ['add', 'remove', 'modify', 'restructure'].includes(c.type) ? c.type : 'modify',
      description: c.description || '未描述',
      rationale: c.rationale || '未说明'
    })),
    appliedTechniques: result.appliedTechniques || [],
    expectedImprovements: result.expectedImprovements || [],
    nextIterationSuggestions: result.nextIterationSuggestions || []
  };
}

function getDefaultIteration(originalPrompt: string): IterationResult {
  return {
    originalPrompt,
    optimizedPrompt: originalPrompt,
    changes: [{ type: 'modify', description: '服务暂时不可用，未做修改', rationale: 'LLM服务错误' }],
    appliedTechniques: [],
    expectedImprovements: ['请检查模型配置'],
    nextIterationSuggestions: ['确认API密钥有效']
  };
}

export function getStrategiesForDimension(dimension: string): IterationStrategy[] {
  return ITERATION_STRATEGIES.filter(s => 
    s.applicableDimensions.includes(dimension)
  );
}

export function getAllStrategies(): IterationStrategy[] {
  return ITERATION_STRATEGIES;
}