import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { BackupManager } from '../services/backup-manager';
import { getDatabase } from '../db/sqlite';

const router = Router();

// 获取 backup manager 实例
function getBackupManager() {
  const db = getDatabase();
  return new BackupManager(db, './data/backups');
}

// GET /api/backup/list - 获取备份列表
router.get('/list', async (req, res) => {
  try {
    const manager = getBackupManager();
    const backups = manager.listBackups();
    res.json({ success: true, data: backups });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/backup/export - 创建备份
router.post('/export', async (req, res) => {
  try {
    const { description } = req.body;
    const manager = getBackupManager();
    const filepath = await manager.exportToJSON(description);
    const filename = path.basename(filepath);
    
    res.json({ 
      success: true, 
      data: { 
        filename, 
        filepath,
        downloadUrl: `/api/backup/download/${filename}` 
      } 
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/backup/import - 导入备份
router.post('/import', async (req, res) => {
  try {
    const { filename, merge = false } = req.body;
    
    if (!filename) {
      res.status(400).json({ success: false, error: '缺少文件名' });
      return;
    }
    
    const filepath = path.join('./data/backups', filename);
    const manager = getBackupManager();
    const metadata = await manager.importFromJSON(filepath, merge);
    
    res.json({ 
      success: true, 
      data: { 
        message: '导入成功',
        metadata 
      } 
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/backup/download/:filename - 下载备份文件
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join('./data/backups', filename);
    
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: '文件不存在' });
      return;
    }
    
    res.download(filepath, filename);
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// DELETE /api/backup/:filename - 删除备份
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const manager = getBackupManager();
    const success = manager.deleteBackup(filename);
    
    if (success) {
      res.json({ success: true, data: { message: '删除成功' } });
    } else {
      res.status(404).json({ success: false, error: '文件不存在' });
    }
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/backup/auto - 触发自动备份
router.post('/auto', async (req, res) => {
  try {
    const { maxBackups = 10 } = req.body;
    const manager = getBackupManager();
    const filepath = await manager.autoBackup(maxBackups);
    const filename = path.basename(filepath);
    
    res.json({ 
      success: true, 
      data: { 
        message: '自动备份完成',
        filename,
        filepath 
      } 
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

export default router;
