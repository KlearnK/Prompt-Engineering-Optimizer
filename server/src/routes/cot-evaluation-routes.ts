import { Router } from 'express';
import { cotEvaluationService } from '../services/cot-evaluation-service';

const router = Router();

/**
 * POST /api/evaluate-cot
 * CoT增强评估接口
 */
router.post('/evaluate-cot', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, model = 'deepseek-chat' } = req.body;

    // 参数验证
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: prompt (string required)'
      });
      return;
    }

    if (prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Prompt cannot be empty'
      });
      return;
    }

    if (prompt.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Prompt too long (max 10000 characters)'
      });
      return;
    }

    console.log(`[API /evaluate-cot] Received request, prompt length: ${prompt.length}`);

    // 执行CoT评估
    const report = await cotEvaluationService.evaluateWithCoT(prompt, model);

    const duration = Date.now() - startTime;
    console.log(`[API /evaluate-cot] Completed in ${duration}ms`);

    res.json({
      success: true,
      data: report,
      meta: {
        apiVersion: '2.0',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API /evaluate-cot] Error after ${duration}ms:`, error);

    res.status(500).json({
      success: false,
      error: 'Evaluation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/evaluate-cot/dimensions
 * 获取评估维度定义
 */
router.get('/evaluate-cot/dimensions', (req, res) => {
  const { EVALUATION_DIMENSIONS } = require('../services/cot-evaluation-service');
  
  res.json({
    success: true,
    data: EVALUATION_DIMENSIONS.map((d: any) => ({
      key: d.key,
      name: d.name,
      description: d.description,
      weight: d.weight
    }))
  });
});

export default router;