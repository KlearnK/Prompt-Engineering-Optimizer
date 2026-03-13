import { callModel } from './model-router';

export interface EvaluationResult {
  scores: {
    clarity: number;
    specificity: number;
    role: number;
    context: number;
    outputFormat: number;
    constraints: number;
  };
  totalScore: number;
  feedback: string[];
  optimized: string;
}

const EVALUATION_PROMPT = `你是一个专业的Prompt Engineering评估专家。请根据Google的6条最佳实践原则，对以下提示词进行评估和优化。

6条原则：
1. 清晰度(Clarity)：表达是否清晰无歧义
2. 具体性(Specificity)：是否提供了足够的细节和上下文
3. 角色设定(Role)：是否明确了AI应该扮演的角色
4. 上下文(Context)：是否提供了必要的背景信息
5. 输出格式(Output Format)：是否指定了期望的输出格式
6. 约束条件(Constraints)：是否设置了必要的限制条件

请按以下JSON格式返回：
{
  "scores": {
    "clarity": 1-10,
    "specificity": 1-10,
    "role": 1-10,
    "context": 1-10,
    "outputFormat": 1-10,
    "constraints": 1-10
  },
  "feedback": ["具体改进建议1", "建议2", ...],
  "optimized": "优化后的完整提示词"
}

待评估提示词：
{{prompt}}`;

export async function evaluatePrompt(
  prompt: string, 
  modelId: string = 'deepseek'
): Promise<EvaluationResult> {
  const response = await callModel(modelId, [
    { role: 'system', content: '你是一个专业的Prompt Engineering评估专家。只返回JSON格式，不要其他解释。' },
    { role: 'user', content: EVALUATION_PROMPT.replace('{{prompt}}', prompt) }
  ], { temperature: 0.3 });

  try {
    const result = JSON.parse(response.content);
    const scores: number[] = Object.values(result.scores);
    result.totalScore = scores.reduce((a: number, b: number) => a + b, 0);
    return result;
  } catch (e) {
    throw new Error('Failed to parse evaluation result: ' + response.content);
  }
}
