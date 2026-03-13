import fs from 'fs';
import path from 'path';
import { SkillManifest } from './skill-packager';

export interface DocSection {
  title: string;
  content: string;
  level: number;
}

export interface GeneratedDocs {
  readme: string;
  apiReference: string;
  examples: string;
  changelog: string;
}

export class DocumentationGenerator {
  private outputDir: string;
  private skillsDir: string;

  constructor(skillsDir: string = './data/skills', outputDir: string = './docs') {
    this.skillsDir = skillsDir;
    this.outputDir = outputDir;
    this.ensureDir(this.outputDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 生成完整文档套件
  async generateAllDocs(): Promise<GeneratedDocs> {
    const docs: GeneratedDocs = {
      readme: this.generateMainReadme(),
      apiReference: this.generateApiReference(),
      examples: this.generateExamplesDoc(),
      changelog: this.generateChangelog()
    };

    // 写入文件
    fs.writeFileSync(path.join(this.outputDir, 'README.md'), docs.readme, 'utf-8');
    fs.writeFileSync(path.join(this.outputDir, 'API_REFERENCE.md'), docs.apiReference, 'utf-8');
    fs.writeFileSync(path.join(this.outputDir, 'EXAMPLES.md'), docs.examples, 'utf-8');
    fs.writeFileSync(path.join(this.outputDir, 'CHANGELOG.md'), docs.changelog, 'utf-8');

    // 生成 Skill 专用文档
    await this.generateSkillDocs();

    return docs;
  }

  // 生成主 README
  private generateMainReadme(): string {
    const skills = this.getAllSkills();

    return `# PromptCraft V5 使用文档

> 自动生成于 ${new Date().toLocaleString('zh-CN')}

## 项目简介

PromptCraft V5 是一个个人版提示词优化系统，支持多模型接入、个人学习分析和 Skill 插件系统。

## 功能特性

- ✅ **多模型支持**: OpenAI, DeepSeek, Qwen 等
- ✅ **提示词优化**: 递归优化和 A/B 测试
- ✅ **个人学习系统**: 使用偏好分析和洞察报告
- ✅ **Skill 插件**: 可热加载的 JavaScript 插件系统
- ✅ **数据管理**: SQLite 存储，支持 JSON 导入/导出
- ✅ **版本控制**: Skill 版本管理和分享

## 快速开始

### 启动服务

\`\`\`bash
docker compose up -d
\`\`\`

### 访问界面

- 主界面: http://localhost:8082
- 学习洞察: http://localhost:8082/analytics
- API 文档: http://localhost:3001/api/docs

## Skill 列表

当前共有 ${skills.length} 个可用 Skill:

${skills.map(s => `- **${s.name}**: ${s.description || '暂无描述'}`).join('\n')}

## 目录

- [API 参考](API_REFERENCE.md)
- [使用示例](EXAMPLES.md)
- [更新日志](CHANGELOG.md)
- [Skill 文档](./skills/)

## 系统架构

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  SQLite DB  │
│  (React)    │     │  (Express)  │     │  (Data)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Skills    │
                    │ (Hot Load)  │
                    └─────────────┘
\`\`\`

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License - 个人使用免费
`;
  }

  // 生成 API 参考文档
  private generateApiReference(): string {
    return `# API 参考文档

> 自动生成于 ${new Date().toLocaleString('zh-CN')}

## 基础信息

- 基础 URL: http://localhost:3001/api
- 内容类型: application/json

## 认证

当前版本无需认证（个人本地使用）。

## 端点列表

### 提示词优化

#### POST /optimize
优化提示词。

**请求体:**
\`\`\`json
{
  "prompt": "原始提示词",
  "model": "deepseek-chat",
  "skill": "code-review"
}
\`\`\`

**响应:**
\`\`\`json
{
  "success": true,
  "data": {
    "optimized": "优化后的提示词",
    "iterations": 3,
    "improvements": ["改进点1", "改进点2"]
  }
}
\`\`\`

### Skill 管理

#### GET /skills
获取所有 Skill 列表。

**响应:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "name": "code-review",
      "description": "代码审查助手",
      "version": "1.0.0"
    }
  ]
}
\`\`\`

#### POST /skills/:name/execute
执行指定 Skill。

#### POST /skills/auto-execute
自动选择并执行合适的 Skill。

#### POST /skills/import
导入 .skill 文件。

**请求:** multipart/form-data
- file: .skill 文件

#### GET /skills/export/list
获取已导出的 Skill 列表。

### 数据分析

#### GET /analytics/overview
获取使用概览。

#### GET /analytics/preferences
获取偏好分析。

#### GET /analytics/insights
获取洞察报告。

### 数据备份

#### POST /backup/export
创建数据备份。

#### POST /backup/import
导入备份数据。

#### GET /backup/list
获取备份列表。

#### GET /backup/download/:filename
下载备份文件。

## 错误处理

所有错误响应格式:
\`\`\`json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
\`\`\`

## 状态码

- 200: 成功
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误
`;
  }

  // 生成示例文档
  private generateExamplesDoc(): string {
    return `# 使用示例

> 自动生成于 ${new Date().toLocaleString('zh-CN')}

## 基础示例

### 1. 优化提示词

\`\`\`bash
curl -X POST http://localhost:3001/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "帮我写个 Python 脚本",
    "model": "deepseek-chat"
  }'
\`\`\`

### 2. 使用 Skill 优化

\`\`\`bash
curl -X POST http://localhost:3001/api/skills/code-review/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "function add(a,b) { return a+b; }",
    "options": { "language": "javascript" }
  }'
\`\`\`

### 3. 自动选择 Skill

\`\`\`bash
curl -X POST http://localhost:3001/api/skills/auto-execute \
  -H "Content-Type: application/json" \
  -d '{
    "text": "请帮我优化这封邮件..."
  }'
\`\`\`

## Skill 开发示例

### 创建新 Skill

创建文件 \`data/skills/my-skill.skill.js\`:

\`\`\`javascript
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
\`\`\`

## 数据备份示例

### 创建备份

\`\`\`bash
curl -X POST http://localhost:3001/api/backup/export \
  -H "Content-Type: application/json" \
  -d '{ "description": "每周备份" }'
\`\`\`

### 导入备份

\`\`\`bash
curl -X POST http://localhost:3001/api/backup/import \
  -H "Content-Type: application/json" \
  -d '{ 
    "filename": "backup-2024-01-01.json",
    "merge": false 
  }'
\`\`\`

## Skill 分享示例

### 导出 Skill

\`\`\`bash
curl -X POST http://localhost:3001/api/skills/export/code-review \
  -H "Content-Type: application/json" \
  -d '{
    "author": "Your Name",
    "tags": ["code", "review"],
    "description": "代码审查助手 v2"
  }'
\`\`\`

### 导入 Skill

\`\`\`bash
curl -X POST http://localhost:3001/api/skills/import \
  -F "file=@code-review-v1.0.0.skill" \
  -F "overwrite=true"
\`\`\`

## 前端集成示例

### React Hook

\`\`\`typescript
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
\`\`\`
`;
  }

  // 生成更新日志
  private generateChangelog(): string {
    return `# 更新日志

> 自动生成于 ${new Date().toLocaleString('zh-CN')}

## [V5.0.0] - ${new Date().toISOString().split('T')[0]}

### 新增功能

#### Week 4 - 数据与分享系统
- ✅ 数据导出/导入功能（SQLite ↔ JSON）
- ✅ 自动备份机制（保留最近 10 个备份）
- ✅ Skill 分享格式（.skill 文件）
- ✅ Skill 版本管理
- ✅ 文档自动生成系统
- ✅ 使用示例库

#### Week 3 - Skill 插件系统
- ✅ Skill 接口定义与规范
- ✅ 文件热加载机制（3 秒延迟）
- ✅ 3 个内置 Skill（code-review, email-optimizer, tech-translator）
- ✅ Skill 执行 API
- ✅ 自动 Skill 选择

#### Week 2 - 个人学习系统
- ✅ SQLite 数据库存储
- ✅ 使用记录追踪
- ✅ 偏好检测引擎
- ✅ 洞察报告生成
- ✅ 学习洞察仪表盘

#### Week 1 - 基础功能
- ✅ 多模型接入（OpenAI/DeepSeek/Qwen）
- ✅ 提示词优化核心
- ✅ 基础 UI 界面
- ✅ Docker 部署

### 技术栈

- 后端: Node.js 20 + Express + TypeScript + SQLite3
- 前端: React + TypeScript
- 部署: Docker + Docker Compose
- Skill: JavaScript (CommonJS)

### 待办事项

- [ ] 用户认证系统
- [ ] 云端同步
- [ ] 社区 Skill 市场
- [ ] 移动端适配
- [ ] 性能优化

## 版本说明

### 版本号规则

遵循语义化版本控制 (SemVer):
- MAJOR: 不兼容的 API 修改
- MINOR: 向下兼容的功能新增
- PATCH: 向下兼容的问题修复

### Skill 版本

Skill 独立版本管理，可在 manifest 中指定依赖的最低系统版本。
`;
  }

  // 生成单个 Skill 的文档
  private async generateSkillDocs(): Promise<void> {
    const skillsDir = path.join(this.outputDir, 'skills');
    this.ensureDir(skillsDir);

    const skills = this.getAllSkills();

    for (const skill of skills) {
      const doc = this.generateSingleSkillDoc(skill);
      const filename = `${skill.name}.md`;
      fs.writeFileSync(path.join(skillsDir, filename), doc, 'utf-8');
    }
  }

  private generateSingleSkillDoc(skill: any): string {
    return `# ${skill.name} Skill 文档

## 基本信息

- **名称**: ${skill.name}
- **版本**: ${skill.version || '1.0.0'}
- **描述**: ${skill.description || '暂无描述'}
- **作者**: ${skill.author || 'Anonymous'}
${skill.email ? `- **邮箱**: ${skill.email}` : ''}

## 标签

${(skill.tags || []).map((t: string) => `\`\`${t}\`\``).join(' ') || '无'}

## 使用方法

### 直接执行

\`\`\`bash
curl -X POST http://localhost:3001/api/skills/${skill.name}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": "你的输入内容",
    "options": {}
  }'
\`\`\`

### 自动选择

系统会根据输入内容自动判断是否适合使用此 Skill。

## 配置选项

\`\`\`json
${JSON.stringify(skill.config || {}, null, 2)}
\`\`\`

## 示例

### 示例 1: 基础使用

\`\`\`javascript
const result = await fetch('/api/skills/${skill.name}/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: '示例输入',
    options: {}
  })
});
\`\`\`

## 源码

文件位置: \`data/skills/${skill.name}.skill.js\`

## 更新历史

- ${skill.updatedAt || new Date().toISOString()}: 创建文档

---

> 自动生成，请勿手动修改
`;
  }

  // 获取所有 Skill 信息
  private getAllSkills(): any[] {
    if (!fs.existsSync(this.skillsDir)) {
      return [];
    }

    return fs.readdirSync(this.skillsDir)
      .filter(f => f.endsWith('.skill.js'))
      .map(f => {
        const name = f.replace('.skill.js', '');
        const manifestPath = path.join(this.skillsDir, `${name}.manifest.json`);

        if (fs.existsSync(manifestPath)) {
          return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        }

        return { name, version: '1.0.0', description: '', tags: [] };
      });
  }
}

// Markdown 渲染工具
export function renderMarkdownToHTML(markdown: string): string {
  // 简单的 Markdown 转 HTML（生产环境建议使用 marked 库）
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
