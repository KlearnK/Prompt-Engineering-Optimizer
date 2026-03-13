import React, { useState, useRef } from 'react';
import { Download, Upload, Trash2, AlertCircle } from 'lucide-react';
import { useOptimizationHistory } from '@/hooks/useOptimizationHistory';

export const DataManager: React.FC = () => {
  const { exportData, importData } = useOptimizationHistory();
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptcraft-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('数据导出成功');
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      alert('请输入要导入的JSON数据');
      return;
    }
    setIsImporting(true);
    try {
      await importData(importText);
      setImportText('');
      alert('数据导入成功');
    } catch (error) {
      alert('导入失败: ' + (error instanceof Error ? error.message : '格式错误'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      alert('文件已读取，请点击导入按钮');
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有历史数据吗？此操作不可恢复！')) return;
    try {
      const { db } = await import('@/db/promptcraft-db');
      await db.optimizations.clear();
      await db.evaluations.clear();
      await db.usageStats.clear();
      alert('所有数据已清空');
      window.location.reload();
    } catch (error) {
      alert('清空失败');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          导出数据
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          将所有历史记录导出为JSON文件，可用于备份。
        </p>
        <button onClick={handleExport} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          下载备份文件
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          导入数据
        </h3>
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 px-4 py-2 rounded mb-4">
          选择文件
        </button>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="或将JSON数据粘贴到这里..."
          className="w-full h-32 border rounded p-2 font-mono text-sm"
        />
        <div className="flex items-center gap-2 text-sm text-gray-500 my-2">
          <AlertCircle className="w-4 h-4" />
          <span>导入将覆盖现有数据</span>
        </div>
        <button 
          onClick={handleImport} 
          disabled={isImporting || !importText.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isImporting ? '导入中...' : '确认导入'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-red-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
          <Trash2 className="w-5 h-5" />
          危险区域
        </h3>
        <button onClick={handleClearAll} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          清空所有数据
        </button>
      </div>
    </div>
  );
};

export default DataManager;