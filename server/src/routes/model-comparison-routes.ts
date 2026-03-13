import { Router, Request, Response } from 'express';
import { compareModels, VotingStrategy, COMPARISON_MODELS } from '../services/model-comparison-service';

const router = Router();

/**
 * POST /api/compare-models
 */
router.post('/compare-models', async (req: Request, res: Response) => {
  try {
    const { 
      prompt, 
      taskType = 'optimization',
      votingStrategy = 'hybrid',
      preferredModel,  // 新增：用户偏好的基准模型
      apiKeys = {} 
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: '缺少必需参数: prompt (string)',
      });
      return;
    }

    if (prompt.length > 5000) {
      res.status(400).json({
        success: false,
        error: '提示词长度超过5000字符限制',
      });
      return;
    }

    if (!['optimization', 'evaluation'].includes(taskType)) {
      res.status(400).json({
        success: false,
        error: 'taskType必须是 "optimization" 或 "evaluation"',
      });
      return;
    }

    if (!['majority', 'llm-judge', 'hybrid'].includes(votingStrategy)) {
      res.status(400).json({
        success: false,
        error: 'votingStrategy必须是 "majority", "llm-judge" 或 "hybrid"',
      });
      return;
    }

    console.log(`[ModelComparison] 开始对比 | 策略: ${votingStrategy} | 任务: ${taskType} | 偏好模型: ${preferredModel || '无'}`);
    console.log(`[ModelComparison] 提示词: ${prompt.substring(0, 100)}...`);

    const result = await compareModels(
      prompt,
      taskType as 'optimization' | 'evaluation',
      votingStrategy as VotingStrategy,
      preferredModel,  // 新增：传递给服务层
      apiKeys
    );

    console.log(`[ModelComparison] 对比完成 | 获胜者: ${result.voting.winner || '无'} | 一致性: ${result.voting.consistencyScore}`);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[ModelComparison] 错误:', error);
    res.status(500).json({
      success: false,
      error: '多模型对比失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
});

/**
 * GET /api/compare-models/models
 */
router.get('/compare-models/models', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      models: COMPARISON_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
      })),
      votingStrategies: [
        { id: 'majority', name: '简单多数投票', description: '选择相似度最高的聚类代表' },
        { id: 'llm-judge', name: 'LLM评判', description: '让AI评判哪个输出最好' },
        { id: 'hybrid', name: '混合策略', description: '先多数投票，平局时启用LLM评判（推荐）' },
      ],
      taskTypes: [
        { id: 'optimization', name: '提示词优化', description: '优化提示词质量' },
        { id: 'evaluation', name: '提示词评估', description: '评估提示词质量并打分' },
      ],
    },
  });
});

/**
 * POST /api/compare-models/quick
 */
router.post('/compare-models/quick', async (req: Request, res: Response) => {
  try {
    const { prompt, taskType = 'optimization' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: '缺少必需参数: prompt',
      });
      return;
    }

    const result = await compareModels(
      prompt,
      taskType,
      'hybrid',
      undefined,  // 快速对比不指定偏好模型
      {}
    );

    res.json({
      success: true,
      data: {
        winner: result.voting.winner,
        bestOutput: result.bestOutput,
        consistencyScore: result.voting.consistencyScore,
        modelCount: result.results.filter(r => !r.error).length,
        totalLatency: result.totalLatency,
      },
    });

  } catch (error) {
    console.error('[ModelComparison] 快速对比错误:', error);
    res.status(500).json({
      success: false,
      error: '快速对比失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
});

export default router;