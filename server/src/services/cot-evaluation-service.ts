/**
 * Chain-of-Thought 评估服务
 * 完全适配V05 multiLLM.ts接口
 */

import { callMultipleLLMs, LLMRequest, LLMResponse } from '../multiLLM';

// 6维度定义
export const EVALUATION_DIMENSIONS = [
  {
    key: 'clarity',
    name: '清晰度',
    description: '提示词是否明确表达了任务意图，角色定义是否清晰',
    weight: 1.0
  },
  {
    key: 'specificity',
    name: '特异性',
    description: '是否包含足够的上下文、细节和约束条件',
    weight: 1.0
  },
  {
    key: 'structure',
    name: '结构性',
    description: '是否有清晰的输入/输出格式，逻辑流程是否明确',
    weight: 1.0
  },
  {
    key: 'completeness',
    name: '完整性',
    description: '是否包含完成任务所需的所有关键信息',
    weight: 1.0
  },
  {
    key: 'tone',
    name: '语气适配',
    description: '语气、风格是否符合目标场景和受众需求',
    weight: 0.8
  },
  {
    key: 'constraints',
    name: '约束性',
    description: '是否设置了必要的边界条件、限制和禁止事项',
    weight: 0.8
  }
];

export interface CoTEvaluationResult {
  dimension: string;
  key: string;
  score: number;
  reasoning: string;
  suggestions: string[];
  examples: {
    good?: string;
    bad?: string;
  };
}

export interface CoTEvaluationReport {
  overallScore: number;
  dimensionEvaluations: CoTEvaluationResult[];
  summary: string;
  priorityImprovements: string[];
  fullReasoningChain: string;
  metadata: {
    model: string;
    timestamp: string;
    version: string;
  };
}

const COT_SYSTEM_PROMPT = `你是一位专业的提示词工程专家，擅长使用Chain-of-Thought方法逐步分析提示词质量。

分析原则：
1. 逐步思考：先理解提示词意图，再分析具体维度
2. 引用原文：分析时引用提示词的具体内容作为证据
3. 具体建议：每条建议都要可操作，避免空泛
4. 正反示例：提供修改前后的对比示例

输出必须严格遵循JSON格式。`;

const generateDimensionPrompt = (prompt: string, dimension: typeof EVALUATION_DIMENSIONS[0]) => 
`请评估以下提示词的【${dimension.name}】维度。

提示词内容：
"""
${prompt}
"""

维度定义：${dimension.description}

请按以下步骤思考：
步骤1：理解提示词核心意图，识别与${dimension.name}相关的具体内容
步骤2：分析当前在${dimension.name}方面的表现，引用原文说明优点和不足
步骤3：给出1-10分的评分（6分及格，8分优秀），解释扣分原因
步骤4：提供3条具体的、可操作的改进建议
步骤5：给出一个优秀示例（展示如何改进）

以JSON格式输出（不要包含markdown标记）：
{
  "reasoning": "详细思考过程（200-300字），包含对原文的引用",
  "score": 数字,
  "suggestions": ["建议1", "建议2", "建议3"],
  "examples": {
    "bad": "当前提示词中存在的问题片段",
    "good": "改进后的优秀示例"
  }
}`;

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

export class CoTEvaluationService {
  
  async evaluateWithCoT(
    prompt: string, 
    model: string = 'deepseek-chat'
  ): Promise<CoTEvaluationReport> {
    
    console.log(`[CoT Evaluation] Starting evaluation with model: ${model}`);
    const startTime = Date.now();

    // 并行评估所有6个维度
    const evaluationPromises = EVALUATION_DIMENSIONS.map(async (dimension) => {
      try {
        return await this.evaluateDimension(prompt, dimension, model);
      } catch (error) {
        console.error(`[CoT Evaluation] Failed for dimension ${dimension.name}:`, error);
        return this.getDefaultErrorResult(dimension);
      }
    });

    const dimensionResults = await Promise.all(evaluationPromises);
    
    // 计算加权总分
    const totalWeight = EVALUATION_DIMENSIONS.reduce((sum, d) => sum + d.weight, 0);
    const weightedScore = dimensionResults.reduce((sum, result) => {
      const dimConfig = EVALUATION_DIMENSIONS.find(d => d.key === result.key);
      return sum + (result.score * (dimConfig?.weight || 1));
    }, 0) / totalWeight;

    const overallScore = Math.round(weightedScore * 10) / 10;

    const report: CoTEvaluationReport = {
      overallScore,
      dimensionEvaluations: dimensionResults,
      summary: this.generateSummary(dimensionResults),
      priorityImprovements: this.extractPriorityImprovements(dimensionResults),
      fullReasoningChain: this.buildReasoningChain(dimensionResults),
      metadata: {
        model,
        timestamp: new Date().toISOString(),
        version: '2.0-cot'
      }
    };

    console.log(`[CoT Evaluation] Completed in ${Date.now() - startTime}ms, score: ${overallScore}`);
    return report;
  }

  private async evaluateDimension(
    prompt: string, 
    dimension: typeof EVALUATION_DIMENSIONS[0],
    modelName: string
  ): Promise<CoTEvaluationResult> {
    
    const userPrompt = generateDimensionPrompt(prompt, dimension);
    
    // 构造LLMRequest（符合V05接口）
    const request: LLMRequest = {
      messages: [
        { role: 'system', content: COT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    };

    // 获取模型配置
    const modelConfigs = getModelConfigs(modelName);
    
    // 调用V05 multiLLM
    const responses: LLMResponse[] = await callMultipleLLMs(request, modelConfigs);
    
    // 处理响应（使用第一个成功的响应）
    const successfulResponse = responses.find(r => r.content && !r.error);
    
    if (!successfulResponse || !successfulResponse.content) {
      const errors = responses.map(r => `${r.provider}: ${r.error || 'no content'}`).join(', ');
      console.error(`[CoT Evaluation] All LLM calls failed: ${errors}`);
      return this.getDefaultErrorResult(dimension);
    }

    const content = successfulResponse.content;
    console.log(`[CoT Evaluation] Raw response for ${dimension.name}:`, content.substring(0, 200));
    
    try {
      // 尝试从文本中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const cleanContent = jsonMatch[0];
      const parsed = JSON.parse(cleanContent);

      return {
        dimension: dimension.name,
        key: dimension.key,
        score: Math.max(1, Math.min(10, Math.round(parsed.score || 5))),
        reasoning: parsed.reasoning || '未提供思考过程',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : ['建议添加更多具体细节'],
        examples: {
          bad: parsed.examples?.bad || '未提供反面示例',
          good: parsed.examples?.good || '未提供正面示例'
        }
      };
    } catch (parseError) {
      console.error(`[CoT Evaluation] JSON parse error for ${dimension.name}:`, parseError);
      console.error(`[CoT Evaluation] Raw content:`, content);
      return this.getDefaultErrorResult(dimension);
    }
  }

  private getDefaultErrorResult(dimension: typeof EVALUATION_DIMENSIONS[0]): CoTEvaluationResult {
    return {
      dimension: dimension.name,
      key: dimension.key,
      score: 5,
      reasoning: '评估过程出错，使用默认分数',
      suggestions: ['请检查提示词是否包含足够信息', '建议明确任务目标', '考虑添加具体约束条件'],
      examples: { bad: '评估失败', good: '请重试' }
    };
  }

  private generateSummary(results: CoTEvaluationResult[]): string {
    const weakDimensions = results.filter(r => r.score < 6);
    const strongDimensions = results.filter(r => r.score >= 8);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    let summary = '';

    if (avgScore >= 8) {
      summary = `提示词质量优秀（平均分${avgScore.toFixed(1)}），`;
      summary += strongDimensions.length > 0 
        ? `在${strongDimensions.map(d => d.dimension).join('、')}方面表现突出。`
        : '各维度表现均衡。';
    } else if (avgScore >= 6) {
      summary = `提示词质量良好（平均分${avgScore.toFixed(1)}），但仍有提升空间。`;
      if (weakDimensions.length > 0) {
        summary += `建议重点关注${weakDimensions.map(d => d.dimension).join('、')}。`;
      }
    } else {
      summary = `提示词需要大幅改进（平均分${avgScore.toFixed(1)}）。`;
      summary += `主要问题集中在${weakDimensions.slice(0, 2).map(d => d.dimension).join('、')}。`;
    }

    return summary;
  }

  private extractPriorityImprovements(results: CoTEvaluationResult[]): string[] {
    const sorted = [...results].sort((a, b) => a.score - b.score);
    const priorities: string[] = [];
    
    sorted.slice(0, 2).forEach(dim => {
      if (dim.suggestions.length > 0) {
        priorities.push(`[${dim.dimension}] ${dim.suggestions[0]}`);
      }
    });

    if (priorities.length === 0 || sorted[0].score >= 7) {
      priorities.push('提示词整体质量较好，建议尝试不同优化策略进一步提升');
    }

    return priorities;
  }

  private buildReasoningChain(results: CoTEvaluationResult[]): string {
    const lines = results.map(r => {
      const stars = '★'.repeat(Math.floor(r.score / 2)) + '☆'.repeat(5 - Math.floor(r.score / 2));
      return `【${r.dimension}】${stars} (${r.score}/10)\n${r.reasoning}\n`;
    });
    
    return lines.join('\n---\n');
  }
}

export const cotEvaluationService = new CoTEvaluationService();