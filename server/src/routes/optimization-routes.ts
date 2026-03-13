import { Router } from 'express';
import { evaluatePromptWithLLM } from '../services/evaluation-service';
import { iteratePromptWithLLM, getAllStrategies, getStrategiesForDimension } from '../services/iteration-service';
import { getActiveModels, ModelConfig } from '../config/model-config';

const router = Router();

// 评估模式 - 完整LLM评估
router.post('/evaluate', async (req, res) => {
  try {
    const { prompt, context = 'general', model } = req.body;  // 新增：model 参数
    
    if (!prompt) {
      res.status(400).json({ error: '提示词不能为空' });
      return;
    }

    let models: ModelConfig[] = getActiveModels();
    if (models.length === 0) {
      res.status(503).json({ error: '没有可用的LLM模型，请先配置API密钥' });
      return;
    }

    // 如果指定了模型，只使用该模型
    if (model) {
      const selectedModel = models.find(m => m.provider === model || m.model === model);
      if (!selectedModel) {
        res.status(400).json({ error: `指定的模型 "${model}" 不可用或未配置` });
        return;
      }
      models = [selectedModel];
    }

    const evaluation = await evaluatePromptWithLLM(prompt, context, models);
    
    res.json({
      success: true,
      data: evaluation,
      meta: {
        modelsUsed: models.map((m: ModelConfig) => m.provider),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('评估接口错误:', error);
    res.status(500).json({ error: '评估服务内部错误' });
  }
});

// 迭代模式 - LLM驱动优化
router.post('/iterate', async (req, res) => {
  try {
    const { 
      currentPrompt, 
      strategyId, 
      evaluationFeedback = '',
      iterationHistory = [],
      goal = '提升提示词整体质量',
      model  // 新增：model 参数
    } = req.body;
    
    if (!currentPrompt || !strategyId) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    let models: ModelConfig[] = getActiveModels();
    if (models.length === 0) {
      res.status(503).json({ error: '没有可用的LLM模型' });
      return;
    }

    // 如果指定了模型，只使用该模型
    if (model) {
      const selectedModel = models.find(m => m.provider === model || m.model === model);
      if (!selectedModel) {
        res.status(400).json({ error: `指定的模型 "${model}" 不可用或未配置` });
        return;
      }
      models = [selectedModel];
    }

    // 获取策略配置
    const strategies = getAllStrategies();
    const strategy = strategies.find(s => s.id === strategyId);
    
    if (!strategy) {
      res.status(400).json({ error: '未知的迭代策略' });
      return;
    }

    const result = await iteratePromptWithLLM(
      currentPrompt,
      strategy,
      evaluationFeedback,
      iterationHistory,
      goal,
      models
    );
    
    res.json({
      success: true,
      data: result,
      meta: {
        strategyUsed: strategy,
        modelsUsed: models.map((m: ModelConfig) => m.provider),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('迭代接口错误:', error);
    res.status(500).json({ error: '迭代服务内部错误' });
  }
});

// 获取可用迭代策略
router.get('/strategies', (req, res) => {
  const { dimension } = req.query;
  
  if (dimension) {
    res.json({
      strategies: getStrategiesForDimension(dimension as string)
    });
  } else {
    res.json({
      strategies: getAllStrategies()
    });
  }
});

export default router;