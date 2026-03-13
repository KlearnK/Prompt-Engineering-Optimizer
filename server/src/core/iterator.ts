import { callModel } from './model-router';

export interface IterationStep {
  version: number;
  prompt: string;
  feedback?: string;
  timestamp: number;
}

export interface IterationResult {
  steps: IterationStep[];
  currentVersion: number;
  finalPrompt: string;
}

// 系统提示词：递归优化专家（移植prompt-optimizer核心逻辑）
const ITERATION_SYSTEM_PROMPT = `你是一个Prompt Engineering迭代优化专家。你的任务是根据用户反馈，持续改进提示词。

规则：
1. 保留原提示词的有效部分
2. 针对用户反馈的具体问题进行修改
3. 每次只做一个主要改进，避免过度修改
4. 直接返回优化后的提示词，不要解释修改原因
5. 保持提示词的结构清晰

当前提示词版本历史：
{{history}}

用户最新反馈：{{feedback}}

请输出优化后的提示词（仅输出提示词本身，不要任何解释）：`;

export async function iteratePrompt(
  currentPrompt: string,
  feedback: string,
  history: IterationStep[] = [],
  modelId: string = 'deepseek'
): Promise<string> {
  const historyText = history.map((h, i) => 
    `版本${i + 1}:\n${h.prompt}\n反馈: ${h.feedback || '初始版本'}\n`
  ).join('\n---\n');

  const response = await callModel(modelId, [
    { role: 'system', content: ITERATION_SYSTEM_PROMPT
      .replace('{{history}}', historyText)
      .replace('{{feedback}}', feedback) },
    { role: 'user', content: `当前提示词：\n${currentPrompt}\n\n请根据反馈优化：` }
  ], { temperature: 0.7 });

  return response.content.trim();
}

// A/B对比（增强功能）
export async function compareVersions(
  versionA: string,
  versionB: string,
  originalTask: string,
  modelId: string = 'deepseek'
): Promise<{ winner: 'A' | 'B' | 'tie'; reason: string }> {
  const prompt = `请对比以下两个提示词版本，判断哪个更适合任务"${originalTask}"。

版本A：
${versionA}

版本B：
${versionB}

请按以下JSON格式返回：
{
  "winner": "A" | "B" | "tie",
  "reason": "简要说明选择的理由"
}`;

  const response = await callModel(modelId, [
    { role: 'system', content: '你是一个公正的Prompt评估专家。' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

  return JSON.parse(response.content);
}
