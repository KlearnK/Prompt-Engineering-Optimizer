import express from 'express';
import { SkillLoader } from '../skills/skill-loader';
import { SkillInput } from '../skills/types';

export function createSkillRoutes(skillLoader: SkillLoader) {
  const router = express.Router();

  // 获取所有 Skill 列表
  router.get('/skills', (req, res) => {
    const configs = skillLoader.getAllConfigs();
    res.json({
      success: true,
      data: configs,
      count: configs.length
    });
    return;  // 显式 return
  });

  // 获取单个 Skill 详情
  router.get('/skills/:name', (req, res) => {
    const skill = skillLoader.getSkill(req.params.name);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;  // 显式 return
    }

    res.json({
      success: true,
      data: {
        config: skill.config,
        hasCanHandle: !!skill.canHandle
      }
    });
    return;  // 显式 return
  });

  // 执行指定 Skill
  router.post('/skills/:name/execute', async (req, res) => {
    try {
      const { text, context } = req.body;
      const input: SkillInput = { text, context };

      const result = await skillLoader.executeSkill(req.params.name, input);

      if (!result) {
        res.status(400).json({
          success: false,
          error: 'Skill not found or cannot handle this input'
        });
        return;  // 显式 return
      }

      res.json({
        success: true,
        data: result
      });
      return;  // 显式 return
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return;  // 显式 return
    }
  });

  // 自动选择 Skill 执行
  router.post('/skills/auto-execute', async (req, res) => {
    try {
      const { text, context } = req.body;
      const input: SkillInput = { text, context };

      const result = await skillLoader.autoExecute(input);

      if (!result) {
        res.status(400).json({
          success: false,
          error: 'No suitable skill found'
        });
        return;  // 显式 return
      }

      res.json({
        success: true,
        data: result
      });
      return;  // 显式 return
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return;  // 显式 return
    }
  });

  // 导出 Skill 清单
  router.post('/skills/export', async (req, res) => {
    try {
      const manifestPath = await skillLoader.exportManifest();
      res.json({
        success: true,
        data: { manifestPath }
      });
      return;  // 显式 return
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Export failed'
      });
      return;  // 显式 return
    }
  });

  return router;
}
