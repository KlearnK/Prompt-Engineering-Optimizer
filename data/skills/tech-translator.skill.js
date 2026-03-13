/**
 * Skill: 技术文档翻译优化器
 */

const config = {
  name: 'tech-translator',
  displayName: '技术翻译助手',
  description: '优化技术文档翻译提示词，确保术语准确、风格一致',
  version: '1.0.0',
  author: 'PromptCraft',
  tags: ['translation', 'technical', 'documentation'],
  supportedModels: [],
  priority: 30,
  enabled: true
};

function execute(input) {
  const { text, context } = input;

  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const sourceLang = hasChinese ? '中文' : '英文';
  const targetLang = hasChinese ? '英文' : '中文';

  const optimizedPrompt = `请将以下技术内容从${sourceLang}翻译为${targetLang}：

原文：
"""
${text}
"""

翻译要求：
1. **术语一致性**: 
   - 首次出现的技术术语保留原文并标注（如：微服务(Microservices)）
   - 使用行业标准译法，不自行创造新词

2. **风格指南**:
   - 保持技术文档的客观、准确风格
   - 长句拆分，每句一个技术概念
   - 被动语态转主动语态（中文）/ 视情况保留被动（英文）

3. **格式保持**:
   - 保留所有 Markdown 格式（代码块、链接、列表）
   - 保留变量名、函数名、URL 不翻译
   - 数字和单位保持原样

4. **上下文适配**:
   ${context?.domain ? `- 领域：${context.domain}` : '- 领域：通用技术'}
   - 目标读者：技术从业者
   - 专业程度：中高级

5. **输出格式**:
   - 直接翻译文本
   - 术语对照表（关键术语：原文 → 译文 → 理由）
   - 翻译注释（如有歧义或特殊处理）`;

  return {
    text: optimizedPrompt,
    metadata: {
      skillName: config.name,
      confidence: 0.92,
      processingTime: 0,
      suggestions: [
        `检测到的翻译方向：${sourceLang} → ${targetLang}`,
        '如领域特定（如 AI/云原生），建议补充说明以获得更精准术语'
      ]
    }
  };
}

function canHandle(input) {
  const transIndicators = ['翻译', 'translate', '译文', '英文', '中文', 'english', 'chinese'];
  const text = input.text.toLowerCase();
  return transIndicators.some(ind => text.includes(ind)) ||
         input.context?.domain === 'translation';
}

module.exports = { config, execute, canHandle };
