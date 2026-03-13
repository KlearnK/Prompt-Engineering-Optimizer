/**
 * Skill: 代码审查优化器
 * 将模糊的需求描述转换为结构化的代码审查提示词
 */

import { Skill, SkillInput, SkillOutput } from '../types';

const config = {
  name: 'code-review',
  displayName: '代码审查助手',
  description: '优化代码审查提示词，生成结构化的检查清单',
  version: '1.0.0',
  author: 'PromptCraft',
  tags: ['code', 'review', 'quality'],
  supportedModels: [],
  priority: 10,
  enabled: true
};

function execute(input: SkillInput): SkillOutput {
  const { text, context } = input;

  const optimizedPrompt = `请作为资深代码审查员，对以下代码进行全面审查：

\`\`\`
${text}
\`\`\`

请按以下维度进行检查：
1. **功能正确性**: 代码是否实现了预期功能？边界条件处理如何？
2. **代码质量**: 是否遵循 SOLID 原则？是否有重复代码？命名是否清晰？
3. **安全性**: 是否存在 SQL 注入、XSS、敏感信息泄露等风险？
4. **性能**: 是否存在明显的性能瓶颈？算法复杂度是否合理？
5. **可维护性**: 是否有适当的注释？模块划分是否合理？
6. **测试覆盖**: 是否需要补充单元测试？测试场景是否完整？

输出格式：
- 严重问题（必须修复）
- 建议改进（可选优化）
- 正面反馈（做得好的地方）

${context?.targetModel ? `目标运行环境：${context.targetModel}` : ''}`;

  return {
    text: optimizedPrompt,
    metadata: {
      skillName: config.name,
      confidence: 0.95,
      processingTime: 0,
      suggestions: [
        '可以补充具体的编程语言信息以获得更精准的建议',
        '如果是特定框架代码，建议说明框架版本'
      ]
    }
  };
}

function canHandle(input: SkillInput): boolean {
  const codeIndicators = [
    'function', 'const', 'let', 'var', 'class', 'import', 'export',
    'def', 'return', 'if', 'for', 'while', '{', '}', '=>', ';'
  ];
  const text = input.text.toLowerCase();
  return codeIndicators.some(indicator => text.includes(indicator)) ||
         input.context?.domain === 'code';
}

const skill: Skill = { config, execute, canHandle };
export default skill;
