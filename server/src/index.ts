/**
 * PromptCraft V5 Server - 主入口文件
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// 导入路由
import optimizationRoutes from './routes/optimization-routes';
import cotEvaluationRoutes from './routes/cot-evaluation-routes';
import reactIterationRoutes from './routes/react-iteration-routes'; // Phase 2新增
import modelComparisonRoutes from './routes/model-comparison-routes'; // Phase 3新增

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '5.0.0-react'
  });
});

// 注册API路由
app.use('/api', optimizationRoutes);
app.use('/api', cotEvaluationRoutes);
app.use('/api', reactIterationRoutes); // Phase 2新增
app.use('/api', modelComparisonRoutes); // Phase 3新增

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`[PromptCraft V5 Server] Running on port ${PORT}`);
  console.log(`[CoT Evaluation] Route registered at POST /api/evaluate-cot`);
  console.log(`[ReAct Iteration] Route registered at POST /api/iterate-react`); // Phase 2新增
  console.log(`[Model Comparison] Route registered at POST /api/compare-models`); // Phase 3新增
});

export default app;