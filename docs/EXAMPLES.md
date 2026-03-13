# 使用示例

> 自动生成于 2026/3/9 09:55:48

## 基础示例

### 1. 优化提示词

```bash
curl -X POST http://localhost:3001/api/optimize   -H "Content-Type: application/json"   -d '{
    "prompt": "帮我写个 Python 脚本",
    "model": "deepseek-chat"
  }'
```

### 2. 使用 Skill 优化

```bash
curl -X POST http://localhost:3001/api/skills/code-review/execute   -H "Content-Type: application/json"   -d '{
    "input": "function add(a,b) { return a+b; }",
    "options": { "language": "javascript" }
  }'
```

### 3. 自动选择 Skill

```bash
curl -X POST http://localhost:3001/api/skills/auto-execute   -H "Content-Type: application/json"   -d '{
    "text": "请帮我优化这封邮件..."
  }'
```

## Skill 开发示例

### 创建新 Skill

创建文件 `data/skills/my-skill.skill.js`:

```javascript
/**
 * @config
 * {
 *   "version": "1.0.0",
 *   "description": "我的自定义 Skill",
 *   "author": "Your Name",
 *   "tags": ["custom"]
 * }
 */

module.exports = {
  name: 'my-skill',

  async execute(input, context) {
    // 获取配置
    const config = context.config || {};

    // 调用 LLM
    const response = await context.llm.chat({
      model: config.model || 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是助手' },
        { role: 'user', content: input }
      ]
    });

    return {
      success: true,
      output: response.choices[0].message.content,
      metadata: { model: config.model }
    };
  }
};
```

## 数据备份示例

### 创建备份

```bash
curl -X POST http://localhost:3001/api/backup/export   -H "Content-Type: application/json"   -d '{ "description": "每周备份" }'
```

### 导入备份

```bash
curl -X POST http://localhost:3001/api/backup/import   -H "Content-Type: application/json"   -d '{ 
    "filename": "backup-2024-01-01.json",
    "merge": false 
  }'
```

## Skill 分享示例

### 导出 Skill

```bash
curl -X POST http://localhost:3001/api/skills/export/code-review   -H "Content-Type: application/json"   -d '{
    "author": "Your Name",
    "tags": ["code", "review"],
    "description": "代码审查助手 v2"
  }'
```

### 导入 Skill

```bash
curl -X POST http://localhost:3001/api/skills/import   -F "file=@code-review-v1.0.0.skill"   -F "overwrite=true"
```

## 前端集成示例

### React Hook

```typescript
import { useState } from 'react';

function usePromptOptimizer() {
  const [loading, setLoading] = useState(false);

  const optimize = async (prompt: string, skill?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, skill })
      });
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  return { optimize, loading };
}
```
