# PromptCraft V5 使用文档

> 自动生成于 2026/3/9 09:55:48

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

```bash
docker compose up -d
```

### 访问界面

- 主界面: http://localhost:8082
- 学习洞察: http://localhost:8082/analytics
- API 文档: http://localhost:3001/api/docs

## Skill 列表

当前共有 3 个可用 Skill:

- **code-review**: 暂无描述
- **email-optimizer**: 暂无描述
- **tech-translator**: 暂无描述

## 目录

- [API 参考](API_REFERENCE.md)
- [使用示例](EXAMPLES.md)
- [更新日志](CHANGELOG.md)
- [Skill 文档](./skills/)

## 系统架构

```
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
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License - 个人使用免费
