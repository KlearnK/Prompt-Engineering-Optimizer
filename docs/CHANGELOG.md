# 更新日志

> 自动生成于 2026/3/9 09:55:48

## [V5.0.0] - 2026-03-09

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
