import { callMultipleLLMs, LLMRequest, LLMResponse } from '../multiLLM';

// 4模型配置
export const COMPARISON_MODELS = [
  { id: 'deepseek-v3', name: 'DeepSeek-V3', provider: 'deepseek', model: 'deepseek-chat' },
  { id: 'qwen-max', name: 'Qwen-Max', provider: 'qwen', model: 'qwen-max' },
  { id: 'glm-4', name: 'GLM-4', provider: 'zhipu', model: 'glm-4' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', model: 'gpt-4' },
] as const;

export type ComparisonModel = typeof COMPARISON_MODELS[number]['id'];
export type VotingStrategy = 'majority' | 'llm-judge' | 'hybrid';

export interface ModelResult {
  model: ComparisonModel;
  modelName: string;
  output: string;
  latency: number;
  tokenCount?: number;
  error?: string;
}

export interface Cluster {
  id: number;
  representative: string;
  members: ComparisonModel[];
  similarity: number;
}

export interface VotingResult {
  strategy: VotingStrategy;
  clusters: Cluster[];
  winner: ComparisonModel | null;
  consistencyScore: number;
  judgeReasoning?: string;
}

export interface ComparisonResponse {
  results: ModelResult[];
  voting: VotingResult;
  bestOutput: string | null;
  totalLatency: number;
}

/**
 * 计算两个文本的相似度
 */
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (t: string) => t.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
  const n1 = normalize(text1);
  const n2 = normalize(text2);
  
  if (n1.length === 0 || n2.length === 0) return 0;
  if (n1 === n2) return 1.0;

  const getBigrams = (s: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.slice(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(n1);
  const b2 = getBigrams(n2);
  
  const intersection = new Set([...b1].filter(x => b2.has(x)));
  const union = new Set([...b1, ...b2]);
  
  return intersection.size / union.size;
}

/**
 * 相似度聚类
 */
function clusterResults(results: ModelResult[]): Cluster[] {
  const clusters: Cluster[] = [];
  const used = new Set<string>();

  results.forEach((result, idx) => {
    if (used.has(result.model) || result.error) return;

    const cluster: Cluster = {
      id: clusters.length,
      representative: result.output,
      members: [result.model],
      similarity: 1.0,
    };

    results.slice(idx + 1).forEach(other => {
      if (used.has(other.model) || other.error) return;
      
      const sim = calculateSimilarity(result.output, other.output);
      if (sim > 0.6) {
        cluster.members.push(other.model);
        cluster.similarity = Math.min(cluster.similarity, sim);
      }
    });

    cluster.members.forEach(m => used.add(m));
    clusters.push(cluster);
  });

  return clusters;
}

/**
 * LLM-as-Judge
 */
async function llmJudge(
  prompt: string,
  results: ModelResult[],
  taskType: string
): Promise<{ winner: ComparisonModel; reasoning: string }> {
  const validResults = results.filter(r => !r.error);
  
  const judgePrompt = `你需要评判以下${validResults.length}个AI模型对同一提示词的输出，选出最好的一个。

原始提示词：${prompt}

任务类型：${taskType === 'optimization' ? '提示词优化' : '提示词评估'}

各模型输出：
${validResults.map((r, i) => `
[模型${i + 1}: ${r.modelName}]
${r.output.substring(0, 800)}${r.output.length > 800 ? '...' : ''}
`).join('\n---\n')}

评判标准：
1. 准确性和相关性（40%）
2. 完整性和详细度（30%）
3. 清晰度和结构性（20%）
4. 实用性和可操作性（10%）

请直接回答：最好的模型是[模型X]，然后简要说明理由（2-3句话）。`;

  try {
    const request: LLMRequest = {
      messages: [{ role: 'user', content: judgePrompt }],
      temperature: 0.3,
    };

    const judgeConfig = {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
    };

    const responses = await callMultipleLLMs(request, [judgeConfig]);
    const content = responses[0]?.content || '';
    
    const match = content.match(/模型(\d+)/);
    if (match) {
      const winnerIdx = parseInt(match[1]) - 1;
      if (winnerIdx >= 0 && winnerIdx < validResults.length) {
        return {
          winner: validResults[winnerIdx].model,
          reasoning: content.trim(),
        };
      }
    }

    return {
      winner: validResults[0].model,
      reasoning: '无法解析评判结果，默认选择第一个模型。原始评判：' + content.substring(0, 200),
    };
  } catch (error) {
    return {
      winner: validResults[0].model,
      reasoning: `评判过程出错: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 执行投票
 */
async function executeVoting(
  results: ModelResult[],
  strategy: VotingStrategy,
  originalPrompt: string,
  taskType: string
): Promise<VotingResult> {
  const clusters = clusterResults(results);
  
  clusters.sort((a, b) => b.members.length - a.members.length);

  let winner: ComparisonModel | null = null;
  let judgeReasoning: string | undefined;

  if (strategy === 'majority') {
    winner = clusters[0]?.members[0] || null;
  } else if (strategy === 'llm-judge') {
    const judgeResult = await llmJudge(originalPrompt, results, taskType);
    winner = judgeResult.winner;
    judgeReasoning = judgeResult.reasoning;
  } else {
    const maxSize = clusters[0]?.members.length || 0;
    const tiedClusters = clusters.filter(c => c.members.length === maxSize);
    
    if (tiedClusters.length === 1) {
      winner = clusters[0].members[0];
    } else {
      const judgeResult = await llmJudge(originalPrompt, results, taskType);
      winner = judgeResult.winner;
      judgeReasoning = `检测到平局（${tiedClusters.map(c => c.members.join(',')).join(' vs ')}），启用LLM评判：\n${judgeResult.reasoning}`;
    }
  }

  const validCount = results.filter(r => !r.error).length;
  const consistencyScore = validCount > 0 
    ? (clusters[0]?.members.length || 0) / validCount 
    : 0;

  return {
    strategy,
    clusters,
    winner,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    judgeReasoning,
  };
}

/**
 * 多模型对比主函数
 */
export async function compareModels(
  prompt: string,
  taskType: 'optimization' | 'evaluation' = 'optimization',
  votingStrategy: VotingStrategy = 'hybrid',
  preferredModel?: string,
  apiKeys: Record<string, string> = {}
): Promise<ComparisonResponse> {
  const startTime = Date.now();

  // 准备4个模型的配置
  const modelConfigs = [
    { 
      provider: 'deepseek', 
      model: 'deepseek-chat', 
      apiKey: apiKeys.deepseek || process.env.DEEPSEEK_API_KEY || '' 
    },
    { 
      provider: 'qwen', 
      model: 'qwen-max', 
      apiKey: apiKeys.qwen || process.env.QWEN_API_KEY || '' 
    },
    { 
      provider: 'zhipu', 
      model: 'glm-4', 
      apiKey: apiKeys.zhipu || process.env.ZHIPU_API_KEY || '' 
    },
    { 
      provider: 'openai', 
      model: 'gpt-4', 
      apiKey: apiKeys.openai || process.env.OPENAI_API_KEY || '' 
    },
  ];

  const taskPrompt = taskType === 'optimization'
    ? `请优化以下提示词，使其更清晰、具体、有效：\n\n${prompt}\n\n请直接返回优化后的提示词，不要添加额外解释。`
    : `请评估以下提示词的质量（1-10分），并简要说明优缺点：\n\n${prompt}`;

  const request: LLMRequest = {
    messages: [{ role: 'user', content: taskPrompt }],
    temperature: 0.7,
  };

  // 并行调用4个模型
  const modelStartTimes = Date.now();
  const responses = await callMultipleLLMs(request, modelConfigs);
  const totalCallLatency = Date.now() - modelStartTimes;

  // 处理响应
  const results: ModelResult[] = responses.map((resp, idx) => {
    const modelId = COMPARISON_MODELS[idx].id;
    const modelInfo = COMPARISON_MODELS[idx];
    
    return {
      model: modelId,
      modelName: modelInfo.name,
      output: resp.error ? '' : (resp.content || '无输出'),
      latency: Math.floor(totalCallLatency / 4), // 估算每个模型的延迟
      error: resp.error,
    } as ModelResult;
  });

  const voting = await executeVoting(results, votingStrategy, prompt, taskType);
  const bestResult = results.find(r => r.model === voting.winner);
  const bestOutput = bestResult?.output || null;

  return {
    results,
    voting,
    bestOutput,
    totalLatency: Date.now() - startTime,
  };
}

export default compareModels;