/**
 * Skill: 商务邮件优化器
 */

const config = {
  name: 'email-optimizer',
  displayName: '商务邮件助手',
  description: '优化邮件草稿，使其更专业、清晰、有说服力',
  version: '1.0.0',
  author: 'PromptCraft',
  tags: ['writing', 'email', 'business'],
  supportedModels: [],
  priority: 20,
  enabled: true
};

function execute(input) {
  const { text, context } = input;

  const optimizedPrompt = `请将以下邮件草稿优化为专业的商务邮件：

原始草稿：
"""
${text}
"""

优化要求：
1. **主题行**: 撰写简洁有力的主题（< 50 字符）
2. **开场**: 根据收件人关系选择恰当称呼
3. **结构**: 
   - 首段：明确目的（单刀直入）
   - 中段：关键信息（ bullet points 呈现）
   - 尾段：明确行动项（谁做什么，何时完成）
4. **语气**: ${context?.userPreference || '专业且友好'}
5. **长度**: 控制在 5 段以内，每段 < 3 行
6. **结尾**: 适当的结束语和签名档

额外建议：
- 移除冗余词汇（"我觉得", "可能", "也许" → 改为肯定表述）
- 使用主动语态
- 添加紧急程度标识（如适用）

请输出：
1. 优化后的完整邮件
2. 主题行建议（提供 2-3 个选项）
3. 关键改进点说明`;

  return {
    text: optimizedPrompt,
    metadata: {
      skillName: config.name,
      confidence: 0.9,
      processingTime: 0,
      suggestions: [
        '建议补充收件人身份（上级/客户/同事）以调整语气',
        '如有具体截止日期，请明确说明'
      ]
    }
  };
}

function canHandle(input) {
  const emailIndicators = ['邮件', 'email', '主题', '收件人', '尊敬的', '此致敬礼'];
  const text = input.text.toLowerCase();
  return emailIndicators.some(ind => text.includes(ind)) ||
         input.context?.domain === 'email';
}

module.exports = { config, execute, canHandle };
