# Prompt Optimizer Tool - TODO

## Database & Backend
- [x] Database schema: prompts history table
- [x] tRPC router: prompt evaluation (6 dimensions via LLM)
- [x] tRPC router: prompt optimization (one-click optimize via LLM)
- [x] tRPC router: history CRUD (save, list, delete)
- [x] tRPC router: UI/UX keyword converter

## Frontend - Core Features
- [x] App layout: sidebar navigation + main content area
- [x] Global theme: clean professional design with Inter font
- [x] Prompt editor page: multi-line editor with character count
- [x] Quality assessment panel: 6-dimension breakdown with scores
- [x] Optimization result: side-by-side diff comparison view
- [x] One-click optimize button with loading state

## Frontend - Library Features
- [x] Template library panel: categorized prompt templates
- [x] Technique reference library: 58 techniques by category
- [x] Learning module: interactive tutorial with examples/exercises
- [x] History page: list of saved prompts with view/delete
- [x] Export functionality: Markdown and plain text download
- [x] UI/UX keyword converter panel

## Quality & Polish
- [x] Responsive design for all pages
- [x] Loading states and error handling
- [x] Vitest unit tests for backend routers (9 tests passing)
- [x] Final checkpoint

## 中文化 (i18n)
- [x] 中文化 AppLayout 导航
- [x] 中文化 Home 首页
- [x] 中文化 PromptOptimizer 主页面
- [x] 中文化 TemplateLibrary 组件
- [x] 中文化 TechniquesLibrary 页面
- [x] 中文化 LearningModule 页面
- [x] 中文化 HistoryPage 页面
- [x] 中文化后端LLM提示词（评估/优化/UI关键词）

## 独立部署 & 多模型支持
- [x] 多模型提供商：DeepSeek、通义千问、智谱AI、OpenAI
- [x] API Key 本地存储（localStorage）
- [x] 模型配置对话框（测试连接）
- [x] API Key 懒触发（点击评估/优化时才弹出）
- [x] Dockerfile + .dockerignore + cloudbaserc.json
- [x] DEPLOY_CLOUDBASE.md 部署指南

## 本地部署 & 持续学习
- [ ] 扩展数据库Schema：用户行为表、评估权重偏好表、个人知识库表
- [ ] 后端API：行为事件上报（采纳/拒绝建议、评分反馈）
- [ ] 后端API：基于历史行为计算个性化评估权重
- [ ] 后端API：个人知识库（收藏技巧、自定义规则）
- [ ] 后端API：学习统计数据（使用趋势、改进幅度）
- [ ] 前端：行为上报（按钮点击、建议采纳、评分反馈）
- [ ] 前端：学习状态面板（个人偏好、进步曲线）
- [ ] 前端：个性化评估权重展示
- [ ] Docker Compose 配置（app + MySQL）
- [ ] 本地环境变量模板（.env.local.example）
- [ ] 启动脚本（setup.sh）
- [ ] 本地部署指南（DEPLOY_LOCAL.md）
