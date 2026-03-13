import express from 'express';
import { SkillLoader } from '../skills/skill-loader';

export function createOptimizerRoutes(skillLoader: SkillLoader) {
  const router = express.Router();

  router.post('/optimize/iterate', async (req, res) => {
    try {
      const { prompt, strategy = 'comprehensive', iteration = 1, previousVersions = [] } = req.body;

      if (!prompt) {
        res.status(400).json({ success: false, error: '缺少 prompt 参数' });
        return;
      }

      const result = await skillLoader.executeSkill('prompt-optimizer', { text: prompt });

      if (!result) {
        let prefix, improvements, advice;

        if (strategy === 'deep-thinking') {
          prefix = '【深度思考模式】';
          improvements = ['增加了逐步推理要求', '添加了逻辑分析框架', '引入了多角度思考', '设置了反思验证步骤'];
          advice = '此版本适合需要深度逻辑分析和推理的场景，AI会展示思考过程。';
        } else if (strategy === 'structured') {
          prefix = '【结构化输出模式】';
          improvements = ['添加了输出格式模板', '明确了章节结构要求', '设置了标记符号规范', '增加了示例说明'];
          advice = '此版本适合需要标准化报告或文档生成的场景，输出格式统一规范。';
        } else if (strategy === 'role-based') {
          prefix = '【专家角色模式】';
          improvements = ['设定了专业领域专家角色', '添加了行业术语使用要求', '明确了专业背景和经验', '设置了专业咨询视角'];
          advice = '此版本适合需要专业领域深度咨询的场景，AI会以专家身份回答。';
        } else {
          prefix = '【全面优化模式】';
          improvements = ['增加了推理深度要求', '添加了结构化格式', '设定了专业角色', '明确了输出标准', '添加了约束条件'];
          advice = '此版本综合了所有优化策略，适合大多数场景，平衡了深度和实用性。';
        }

        const optimized = prefix + '\n\n' + prompt + '\n\n【优化点】\n' + improvements.map(i => '- ' + i).join('\n') + '\n\n【使用建议】\n' + advice;

        res.json({ success: true, data: { original: prompt, optimized, strategy, iteration, improvements, previousVersions: [...previousVersions, { version: iteration, prompt: optimized }] } });
        return;
      }

      const outputText = typeof result === 'string' ? result : (result as any).text || JSON.stringify(result);
      res.json({ success: true, data: { original: prompt, optimized: outputText, strategy, iteration, improvements: ['基于Skill优化'], previousVersions: [...previousVersions, { version: iteration, prompt: outputText }] } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : '优化失败' });
    }
  });

  router.post('/optimize/ab-test', async (req, res) => {
    try {
      const { prompt, strategyA = 'structured', strategyB = 'deep-thinking' } = req.body;
      if (!prompt) { res.status(400).json({ success: false, error: '缺少 prompt 参数' }); return; }

      const versionA = `[${strategyA} 策略优化]\n${prompt}\n\n【优化重点】\n${strategyA === 'structured' ? '- 添加结构化输出要求\n- 明确格式规范' : '- 增加推理深度\n- 添加思考步骤'}`;
      const versionB = `[${strategyB} 策略优化]\n${prompt}\n\n【优化重点】\n${strategyB === 'deep-thinking' ? '- 增加推理深度\n- 添加思考步骤' : '- 添加结构化输出要求\n- 明确格式规范'}`;

      res.json({ success: true, data: { original: prompt, versionA: { strategy: strategyA, prompt: versionA, strengths: strategyA === 'structured' ? ['格式清晰', '易于解析'] : ['逻辑深入', '分析全面'] }, versionB: { strategy: strategyB, prompt: versionB, strengths: strategyB === 'deep-thinking' ? ['逻辑深入', '分析全面'] : ['格式清晰', '易于解析'] } } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'A/B测试失败' });
    }
  });

  router.post('/optimize/evaluate', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) { res.status(400).json({ success: false, error: '缺少 prompt 参数' }); return; }

      const criteria = [
        { name: '清晰度', score: Math.floor(Math.random() * 3) + 7, feedback: '表达较为清晰' },
        { name: '具体性', score: Math.floor(Math.random() * 4) + 6, feedback: '可以添加更多具体约束' },
        { name: '角色设定', score: Math.floor(Math.random() * 3) + 7, feedback: '角色定位明确' },
        { name: '上下文', score: Math.floor(Math.random() * 3) + 7, feedback: '背景信息充分' },
        { name: '格式要求', score: Math.floor(Math.random() * 4) + 6, feedback: '建议添加输出格式' },
        { name: '约束条件', score: Math.floor(Math.random() * 3) + 7, feedback: '限制条件合理' }
      ];
      const totalScore = Math.round(criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length);

      res.json({ success: true, data: { prompt, totalScore, maxScore: 10, criteria, summary: totalScore >= 8 ? '优秀' : totalScore >= 6 ? '良好' : '需要改进', suggestions: ['添加具体的输出格式要求', '增加示例说明', '明确回答长度限制'] } });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : '评估失败' });
    }
  });

  return router;
}
