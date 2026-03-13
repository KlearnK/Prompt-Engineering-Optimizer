import { callMultipleLLMs, LLMRequest } from '../multiLLM';
import { EvaluationDimension, OptimizationTechnique } from '../shared/promptData';

export interface EvaluationResult {
  dimension: EvaluationDimension;
  score: number;
  feedback: string;
  suggestions: string[];
  examples?: string[];
}

export interface ComprehensiveEvaluation {
  overallScore: number;
  dimensionScores: EvaluationResult[];
  summary: string;
  prioritizedImprovements: string[];
  techniqueRecommendations: OptimizationTechnique[];
}

const EVALUATION_PROMPT_TEMPLATE = `你是一位专业的提示词工程评估专家。请对以下提示词进行多维度评估。

【评估维度】
1. 清晰度(Clarity): 提示词是否清晰明确，无歧义
2. 特异性(Specificity): 是否包含具体细节和要求
3. 结构性(Structure): 逻辑组织是否合理，层次分明
4. 完整性(Completeness): 是否包含必要的上下文和约束
5. 语气适配(Tone): 是否符合目标场景的专业度要求
6. 约束性(Constraints): 是否明确输出格式和限制条件

【待评估提示词】
\`\`\`
{{prompt}}
\`\`\`

【目标场景】
{{context}}

请按以下JSON格式返回评估结果（确保是有效的JSON）:
{
  "overallScore": 8.5,
  "dimensionScores": [
    {
      "dimension": "clarity",
      "score": 9,
      "feedback": "提示词表达清晰，目标明确",
      "suggestions": ["可以进一步细化xxx"],
      "examples": ["优化示例：xxx"]
    }
  ],
  "summary": "总体评价...",
  "prioritizedImprovements": ["优先改进点1", "优先改进点2"],
  "techniqueRecommendations": ["technique_id_1", "technique_id_2"]
}

注意：score范围1-10，必须提供具体可执行的改进建议。`;

export async function evaluatePromptWithLLM(
  prompt: string,
  context: string,
  modelConfigs: Array<{ provider: string; model: string; apiKey: string }>
): Promise<ComprehensiveEvaluation> {
  const evaluationPrompt = EVALUATION_PROMPT_TEMPLATE
    .replace('{{prompt}}', prompt.replace(/`/g, '\\`'))
    .replace('{{context}}', context);

  const request: LLMRequest = {
    messages: [
      { role: 'system', content: '你是一位专业的提示词工程评估专家，擅长分析提示词质量并提供具体改进建议。' },
      { role: 'user', content: evaluationPrompt }
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  };

  try {
    const responses = await callMultipleLLMs(request, modelConfigs);
    
    for (const response of responses) {
      if (response.content) {
        try {
          const result = JSON.parse(response.content) as ComprehensiveEvaluation;
          return validateAndNormalizeEvaluation(result);
        } catch (e) {
          console.warn(`解析模型 ${response.provider} 的评估结果失败:`, e);
          continue;
        }
      }
    }
    
    throw new Error('所有模型评估失败');
  } catch (error) {
    console.error('LLM评估服务错误:', error);
    return getDefaultEvaluation() as ComprehensiveEvaluation;
  }
}

function validateAndNormalizeEvaluation(result: any): ComprehensiveEvaluation {
  return {
    overallScore: result.overallScore || 5,
    dimensionScores: (result.dimensionScores || []).map((d: any) => ({
      dimension: d.dimension || 'clarity',
      score: Math.min(10, Math.max(1, d.score || 5)),
      feedback: d.feedback || '无反馈',
      suggestions: d.suggestions || [],
      examples: d.examples || []
    })),
    summary: result.summary || '评估完成',
    prioritizedImprovements: result.prioritizedImprovements || [],
    techniqueRecommendations: result.techniqueRecommendations || []
  };
}

function getDefaultEvaluation(): any {
  return {
    overallScore: 5,
    dimensionScores: [
      { dimension: 'clarity', score: 5, feedback: '服务暂时不可用', suggestions: ['请稍后重试'], examples: [] },
      { dimension: 'specificity', score: 5, feedback: '服务暂时不可用', suggestions: ['请稍后重试'], examples: [] },
      { dimension: 'structure', score: 5, feedback: '服务暂时不可用', suggestions: ['请稍后重试'], examples: [] },
      { dimension: 'completeness', score: 5, feedback: '服务暂时不可用', suggestions: ['请稍后重试'], examples: [] },
      { dimension: 'tone', score: 5, feedback: '服务暂时不可用', suggestions: ['请稍后重试'], examples: [] },
      { dimension: 'constraints', score: 5, feedback: '服务暂时不可用', suggestions: ['请稍后重试'], examples: [] }
    ],
    summary: '评估服务暂时不可用，请检查模型配置。',
    prioritizedImprovements: ['检查API密钥配置', '确认模型可用性'],
    techniqueRecommendations: []
  };
}