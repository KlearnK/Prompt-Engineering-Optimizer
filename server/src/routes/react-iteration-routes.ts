import { Router } from 'express';
import { reactIterationService } from '../services/react-iteration-service';

const router = Router();

/**
 * POST /api/iterate-react
 * ReAct迭代优化接口
 */
router.post('/iterate-react', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, strategy = 'general', model = 'deepseek-chat' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid parameter: prompt'
      });
      return;
    }

    console.log(`[API /iterate-react] Starting ReAct iteration, strategy: ${strategy}`);

    const result = await reactIterationService.iterateWithReAct(prompt, strategy, model);

    const duration = Date.now() - startTime;
    console.log(`[API /iterate-react] Completed in ${duration}ms, ${result.totalRounds} rounds`);

    res.json({
      success: true,
      data: result,
      meta: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API /iterate-react] Error:`, error);

    res.status(500).json({
      success: false,
      error: 'Iteration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: { duration: `${duration}ms` }
    });
  }
});

export default router;