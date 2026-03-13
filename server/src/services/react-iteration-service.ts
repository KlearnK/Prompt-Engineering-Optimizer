/**
 * ReAct (Reasoning + Acting) 迭代优化服务
 * 支持技术需求识别与转换为提示词
 * 新增：早期停止机制（当分数不再提升时自动停止）
 */

import { callMultipleLLMs, LLMRequest } from '../multiLLM';
import { cotEvaluationService } from './cot-evaluation-service';

export interface ReActStep {
  round: number;
  thought: string;
  action: string;
  observation: string;
  improvedPrompt: string;
  qualityScore: number;
}

export interface ReActIterationResult {
  originalPrompt: string;
  finalPrompt: string;
  totalRounds: number;
  steps: ReActStep[];
  improvementSummary: string;
  qualityTrend: number[];
  inputType: 'prompt' | 'tech_spec';
  stoppedReason: 'threshold' | 'maxRounds' | 'noImprovement';
  bestRound: number;
}

// 早期停止配置
const EARLY_STOPPING_CONFIG = {
  MAX_ROUNDS_WITHOUT_IMPROVEMENT: 1,
  QUALITY_THRESHOLD: 8.0,
  MAX_ROUNDS: 5,
};

const safeJsonParse = (content: string, defaultValue: any): any => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in response:', content.substring(0, 200));
      return defaultValue;
    }
    const cleanContent = jsonMatch[0].replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (e) {
    console.warn('JSON parse error:', e);
    return defaultValue;
  }
};

const detectInputType = (input: string): 'prompt' | 'tech_spec' => {
  const techPatterns = [
    /函数签名|函数定义|class\s+\w+|std::\w+/,
    /API|框架|库|接口/,
    /输入为|输出为|返回|参数/,
    /必须|禁止|须通过|须基于/,
    /<\w+>.*<\/\w+>/,
    /\{.*\}/,
  ];
  const techScore = techPatterns.reduce((score, pattern) => score + (pattern.test(input) ? 1 : 0), 0);
  return techScore >= 3 ? 'tech_spec' : 'prompt';
};

const convertTechSpecToPrompt = (techSpec: string): string => {
  return `请根据以下技术需求，生成一个完整的实现方案：

【技术需求】
${techSpec}

要求：
1. 提供完整的代码实现
2. 包含必要的错误处理
3. 遵循指定的技术约束
4. 输出格式符合要求

请直接输出实现代码，不要包含额外解释。`;
};

const getModelConfigs = (modelName: string) => {
  const normalizedModel = modelName.toLowerCase();
  const modelMapping: Record<string, { provider: string; model: string }> = {
    'deepseek': { provider: 'deepseek', model: 'deepseek-chat' },
    'deepseek-chat': { provider: 'deepseek', model: 'deepseek-chat' },
    'deepseek-v3': { provider: 'deepseek', model: 'deepseek-chat' },
    'qwen': { provider: 'qwen', model: 'qwen-plus' },
    'qwen-max': { provider: 'qwen', model: 'qwen-max' },
    'qwen-plus': { provider: 'qwen', model: 'qwen-plus' },
  };
  const mapped = modelMapping[normalizedModel] || { provider: 'deepseek', model: 'deepseek-chat' };
  const configs = [];
  if (mapped.provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
    configs.push({ provider: 'deepseek', model: mapped.model, apiKey: process.env.DEEPSEEK_API_KEY, baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com' });
  } else if (mapped.provider === 'qwen' && process.env.QWEN_API_KEY) {
    configs.push({ provider: 'qwen', model: mapped.model, apiKey: process.env.QWEN_API_KEY, baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' });
  }
  if (configs.length === 0) {
    configs.push({ provider: 'deepseek', model: 'deepseek-chat', apiKey: process.env.DEEPSEEK_API_KEY || '', baseUrl: 'https://api.deepseek.com' });
  }
  return configs;
};

export class ReActIterationService {
  async iterateWithReAct(originalPrompt: string, strategy: string, modelName: string = 'deepseek-chat'): Promise<ReActIterationResult> {
    const inputType = detectInputType(originalPrompt);
    console.log(`[ReAct] Detected input type: ${inputType}`);
    console.log(`[ReAct] Early stopping config: max ${EARLY_STOPPING_CONFIG.MAX_ROUNDS_WITHOUT_IMPROVEMENT} rounds without improvement`);

    let currentPrompt = inputType === 'tech_spec' ? convertTechSpecToPrompt(originalPrompt) : originalPrompt;
    const steps: ReActStep[] = [];
    let round = 1;
    let bestScore = 0;
    let bestPrompt = currentPrompt;
    let bestRound = 0;
    let roundsWithoutImprovement = 0;
    let stoppedReason: ReActIterationResult['stoppedReason'] = 'maxRounds';

    while (round <= EARLY_STOPPING_CONFIG.MAX_ROUNDS) {
      console.log(`\n[ReAct] ========== Round ${round} ==========`);
      console.log(`[ReAct] Current best: ${bestScore} (round ${bestRound}), no improvement count: ${roundsWithoutImprovement}`);

      const thought = await this.generateThought(currentPrompt, strategy, modelName, inputType);
      console.log(`[ReAct] Round ${round} thought:`, thought.analysis.substring(0, 100));

      const actionResult = await this.executeAction(currentPrompt, thought, strategy, modelName, inputType);
      console.log(`[ReAct] Round ${round} action:`, actionResult.actionDescription.substring(0, 100));

      const observation = await this.generateObservation(currentPrompt, actionResult.improvedPrompt, modelName);
      console.log(`[ReAct] Round ${round} observation:`, observation.feedback.substring(0, 100));

      const evaluation = await cotEvaluationService.evaluateWithCoT(actionResult.improvedPrompt, modelName);

      const step: ReActStep = {
        round,
        thought: thought.analysis,
        action: actionResult.actionDescription,
        observation: observation.feedback,
        improvedPrompt: actionResult.improvedPrompt,
        qualityScore: evaluation.overallScore
      };
      steps.push(step);

      if (evaluation.overallScore > bestScore) {
        const improvement = evaluation.overallScore - bestScore;
        bestScore = evaluation.overallScore;
        bestPrompt = actionResult.improvedPrompt;
        bestRound = round;
        roundsWithoutImprovement = 0;
        console.log(`[ReAct] New best score! ${evaluation.overallScore} (improved +${improvement.toFixed(2)})`);
      } else {
        roundsWithoutImprovement++;
        console.log(`[ReAct] No improvement (${roundsWithoutImprovement}/${EARLY_STOPPING_CONFIG.MAX_ROUNDS_WITHOUT_IMPROVEMENT})`);
      }

      currentPrompt = actionResult.improvedPrompt;

      if (evaluation.overallScore >= EARLY_STOPPING_CONFIG.QUALITY_THRESHOLD) {
        console.log(`[ReAct] Quality threshold reached (${evaluation.overallScore}), stopping.`);
        stoppedReason = 'threshold';
        break;
      }

      if (roundsWithoutImprovement >= EARLY_STOPPING_CONFIG.MAX_ROUNDS_WITHOUT_IMPROVEMENT) {
        console.log(`[ReAct] Early stopping: No improvement for ${roundsWithoutImprovement} rounds.`);
        console.log(`[ReAct] Best score was ${bestScore} at round ${bestRound}`);
        stoppedReason = 'noImprovement';
        currentPrompt = bestPrompt;
        break;
      }

      round++;
    }

    if (round > EARLY_STOPPING_CONFIG.MAX_ROUNDS) {
      console.log(`[ReAct] Max rounds (${EARLY_STOPPING_CONFIG.MAX_ROUNDS}) reached.`);
      if (bestScore > steps[steps.length - 1]?.qualityScore) {
        currentPrompt = bestPrompt;
      }
    }

    console.log(`\n[ReAct] ========== Summary ==========`);
    console.log(`[ReAct] Total rounds: ${steps.length}`);
    console.log(`[ReAct] Best score: ${bestScore} at round ${bestRound}`);
    console.log(`[ReAct] Stopped reason: ${stoppedReason}`);

    return {
      originalPrompt,
      finalPrompt: currentPrompt,
      totalRounds: steps.length,
      steps,
      improvementSummary: this.generateSummary(steps, inputType, stoppedReason, bestRound),
      qualityTrend: steps.map(s => s.qualityScore),
      inputType,
      stoppedReason,
      bestRound
    };
  }

  private async generateThought(prompt: string, strategy: string, modelName: string, inputType: 'prompt' | 'tech_spec'): Promise<{ analysis: string; focusArea: string }> {
    const context = inputType === 'tech_spec' ? '这是一个技术需求，已转换为提示词格式。需要优化提示词的清晰度和可执行性。' : '这是一个提示词，需要优化其结构和表达。';
    const request: LLMRequest = {
      messages: [{
        role: 'user',
        content: `分析以下${inputType === 'tech_spec' ? '转换后的提示词' : '提示词'}，找出改进点：\n\n${context}\n\n当前内容：\n"""\n${prompt}\n"""\n\n优化策略：${strategy}\n\n请输出JSON：\n{\n  "analysis": "详细的问题分析（100-150字）",\n  "focusArea": "本次优化的重点维度"\n}`
      }],
      temperature: 0.4,
      max_tokens: 800
    };
    const modelConfigs = getModelConfigs(modelName);
    const responses = await callMultipleLLMs(request, modelConfigs);
    const content = responses.find(r => r.content)?.content || '{}';
    const result = safeJsonParse(content, { analysis: inputType === 'tech_spec' ? '技术需求已转换，继续优化提示词结构' : '未能分析问题，尝试直接优化', focusArea: '通用优化' });
    return { analysis: result.analysis || '未能分析问题', focusArea: result.focusArea || '通用优化' };
  }

  private async executeAction(currentPrompt: string, thought: { analysis: string; focusArea: string }, strategy: string, modelName: string, inputType: 'prompt' | 'tech_spec'): Promise<{ improvedPrompt: string; actionDescription: string }> {
    const request: LLMRequest = {
      messages: [{
        role: 'user',
        content: `基于以下分析，优化${inputType === 'tech_spec' ? '提示词' : '提示词'}：\n\n当前内容：\n"""\n${currentPrompt}\n"""\n\n问题分析：${thought.analysis}\n优化重点：${thought.focusArea}\n策略：${strategy}\n\n要求：\n1. 保持技术需求的完整性（如果是技术需求）\n2. 使提示词更清晰、具体、可执行\n3. 说明具体做了什么修改\n\n输出JSON：\n{\n  "improvedPrompt": "优化后的完整提示词",\n  "actionDescription": "具体修改说明（50字内）"\n}`
      }],
      temperature: 0.3,
      max_tokens: 2000
    };
    const modelConfigs = getModelConfigs(modelName);
    const responses = await callMultipleLLMs(request, modelConfigs);
    const content = responses.find(r => r.content)?.content || '{}';
    const result = safeJsonParse(content, { improvedPrompt: currentPrompt, actionDescription: '优化提示词' });
    return { improvedPrompt: result.improvedPrompt || currentPrompt, actionDescription: result.actionDescription || '优化提示词' };
  }

  private async generateObservation(beforePrompt: string, afterPrompt: string, modelName: string): Promise<{ feedback: string; isImproved: boolean }> {
    const request: LLMRequest = {
      messages: [{
        role: 'user',
        content: `对比优化前后的提示词，评估改进效果：\n\n优化前："""\n${beforePrompt.substring(0, 500)}...\n"""\n\n优化后："""\n${afterPrompt.substring(0, 500)}...\n"""\n\n评估改进效果，输出JSON：\n{\n  "feedback": "效果评估（80-120字）",\n  "isImproved": true/false\n}`
      }],
      temperature: 0.3,
      max_tokens: 600
    };
    const modelConfigs = getModelConfigs(modelName);
    const responses = await callMultipleLLMs(request, modelConfigs);
    const content = responses.find(r => r.content)?.content || '{}';
    const result = safeJsonParse(content, { feedback: '评估完成，继续优化', isImproved: true });
    return { feedback: result.feedback || '评估完成', isImproved: result.isImproved !== false };
  }

  private generateSummary(steps: ReActStep[], inputType: 'prompt' | 'tech_spec', stoppedReason: string, bestRound: number): string {
    const startScore = steps[0]?.qualityScore || 0;
    const endScore = steps[steps.length - 1]?.qualityScore || 0;
    const improvement = endScore - startScore;
    let summary = inputType === 'tech_spec' ? `技术需求已转换为提示词，经过${steps.length}轮迭代优化` : `经过${steps.length}轮ReAct迭代优化`;
    summary += `，质量评分从${startScore}提升至${endScore}`;
    if (improvement > 0) summary += `，提升了${improvement.toFixed(1)}分`;
    if (stoppedReason === 'noImprovement') summary += `。第${bestRound}轮达到最佳效果，后续无提升自动停止`;
    else if (stoppedReason === 'threshold') summary += `。达到质量阈值自动停止`;
    if (inputType === 'tech_spec') summary += '。原始技术需求已转换为可执行的提示词格式';
    return summary + '。';
  }
}

export const reactIterationService = new ReActIterationService();
