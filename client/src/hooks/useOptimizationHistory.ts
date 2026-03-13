import { useState, useEffect, useCallback } from 'react';
import { db, OptimizationRecord, EvaluationRecord, updateUsageStats } from '@/db/promptcraft-db';

export interface HistoryFilters {
  startDate?: Date;
  endDate?: Date;
  technique?: string;
  model?: string;
}

export function useOptimizationHistory() {
  const [optimizations, setOptimizations] = useState<OptimizationRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载优化历史
  const loadOptimizations = useCallback(async (filters?: HistoryFilters) => {
    setLoading(true);
    try {
      let query = db.optimizations.orderBy('timestamp').reverse();
      
      if (filters?.startDate) {
        query = query.filter(opt => opt.timestamp >= filters.startDate!);
      }
      if (filters?.endDate) {
        query = query.filter(opt => opt.timestamp <= filters.endDate!);
      }
      if (filters?.technique) {
        query = query.filter(opt => opt.technique === filters.technique);
      }
      if (filters?.model) {
        query = query.filter(opt => opt.modelUsed === filters.model);
      }

      const results = await query.toArray();
      setOptimizations(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载评估历史
  const loadEvaluations = useCallback(async (filters?: HistoryFilters) => {
    setLoading(true);
    try {
      let query = db.evaluations.orderBy('timestamp').reverse();
      
      if (filters?.startDate) {
        query = query.filter(eva => eva.timestamp >= filters.startDate!);
      }
      if (filters?.endDate) {
        query = query.filter(eva => eva.timestamp <= filters.endDate!);
      }

      const results = await query.toArray();
      setEvaluations(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 记录优化操作
  const recordOptimization = useCallback(async (data: Omit<OptimizationRecord, 'id' | 'timestamp'>) => {
    try {
      const record: OptimizationRecord = {
        ...data,
        timestamp: new Date(),
      };
      const id = await db.optimizations.add(record);
      await updateUsageStats('optimization', data.technique, data.modelUsed, data.qualityScore);
      return id;
    } catch (err) {
      console.error('记录优化失败:', err);
      throw err;
    }
  }, []);

  // 记录评估操作
  const recordEvaluation = useCallback(async (data: Omit<EvaluationRecord, 'id' | 'timestamp'>) => {
    try {
      const record: EvaluationRecord = {
        ...data,
        timestamp: new Date(),
      };
      const id = await db.evaluations.add(record);
      await updateUsageStats('evaluation', undefined, data.modelUsed, data.overallScore);
      return id;
    } catch (err) {
      console.error('记录评估失败:', err);
      throw err;
    }
  }, []);

  // 删除记录
  const deleteOptimization = useCallback(async (id: number) => {
    await db.optimizations.delete(id);
    await loadOptimizations();
  }, [loadOptimizations]);

  const deleteEvaluation = useCallback(async (id: number) => {
    await db.evaluations.delete(id);
    await loadEvaluations();
  }, [loadEvaluations]);

  // 导出数据
  const exportData = useCallback(async () => {
    const [opts, evas, stats] = await Promise.all([
      db.optimizations.toArray(),
      db.evaluations.toArray(),
      db.usageStats.toArray(),
    ]);
    
    return {
      optimizations: opts,
      evaluations: evas,
      usageStats: stats,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  }, []);

  // 导入数据
  const importData = useCallback(async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.optimizations) {
        await db.optimizations.clear();
        await db.optimizations.bulkAdd(data.optimizations);
      }
      if (data.evaluations) {
        await db.evaluations.clear();
        await db.evaluations.bulkAdd(data.evaluations);
      }
      if (data.usageStats) {
        await db.usageStats.clear();
        await db.usageStats.bulkAdd(data.usageStats);
      }
      
      await loadOptimizations();
      await loadEvaluations();
      return true;
    } catch (err) {
      console.error('导入失败:', err);
      throw err;
    }
  }, [loadOptimizations, loadEvaluations]);

  // 初始加载
  useEffect(() => {
    loadOptimizations();
    loadEvaluations();
  }, [loadOptimizations, loadEvaluations]);

  return {
    optimizations,
    evaluations,
    loading,
    error,
    loadOptimizations,
    loadEvaluations,
    recordOptimization,
    recordEvaluation,
    deleteOptimization,
    deleteEvaluation,
    exportData,
    importData,
  };
}

export default useOptimizationHistory;