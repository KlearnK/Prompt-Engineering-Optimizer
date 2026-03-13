import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { SkillPackager, compareVersions } from '../services/skill-packager';

const router = Router();

// 配置 multer 上传
const upload = multer({ 
  dest: './data/temp/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.skill')) {
      cb(null, true);
    } else {
      cb(new Error('只接受 .skill 文件'));
    }
  }
});

// 获取 packager 实例
function getPackager() {
  return new SkillPackager('./data/skills', './data/exports');
}

// GET /api/skills/export/list - 获取已导出的 Skill 列表
router.get('/export/list', (req, res) => {
  try {
    const packager = getPackager();
    const skills = packager.listExportedSkills();
    res.json({ success: true, data: skills });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/skills/export/:name - 导出指定 Skill
router.post('/export/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { author, email, tags, description } = req.body;
    
    const packager = getPackager();
    const filepath = await packager.packSkill(name, {
      author,
      email,
      tags: Array.isArray(tags) ? tags : tags?.split(',').map((t: string) => t.trim()),
      description
    });
    
    const filename = path.basename(filepath);
    
    res.json({
      success: true,
      data: {
        filename,
        downloadUrl: `/api/skills/export/download/${filename}`,
        manifest: packager.listExportedSkills().find(s => s.filename === filename)?.manifest
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/skills/export-all - 导出所有 Skill
router.post('/export-all', async (req, res) => {
  try {
    const packager = getPackager();
    const exported = await packager.exportAllSkills();
    
    res.json({
      success: true,
      data: {
        count: exported.length,
        files: exported.map(f => path.basename(f))
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/skills/export/download/:filename - 下载导出的 Skill
router.get('/export/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join('./data/exports', filename);
    
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

// POST /api/skills/import - 导入 Skill 文件
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { overwrite = 'false' } = req.body;
    
    if (!file) {
      res.status(400).json({ success: false, error: '没有上传文件' });
      return;
    }
    
    const packager = getPackager();
    
    // 验证文件
    const validation = packager.validateSkillPackage(file.path);
    if (!validation.valid) {
      fs.unlinkSync(file.path);
      res.status(400).json({
        success: false,
        error: '文件验证失败',
        details: validation.errors
      });
      return;
    }
    
    // 解包
    const manifest = await packager.unpackSkill(file.path, overwrite === 'true');
    
    // 清理临时文件
    fs.unlinkSync(file.path);
    
    res.json({
      success: true,
      data: {
        message: '导入成功',
        manifest,
        reloadRequired: true
      }
    });
    return;
  } catch (error) {
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/skills/validate - 验证 Skill 文件
router.post('/validate', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ success: false, error: '没有上传文件' });
      return;
    }
    
    const packager = getPackager();
    const validation = packager.validateSkillPackage(file.path);
    
    // 清理临时文件
    fs.unlinkSync(file.path);
    
    res.json({
      success: true,
      data: validation
    });
    return;
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/skills/compare/:name1/:name2 - 比较两个 Skill 版本
router.get('/compare/:name1/:name2', (req, res) => {
  try {
    const { name1, name2 } = req.params;
    const packager = getPackager();
    const skills = packager.listExportedSkills();
    
    const skill1 = skills.find(s => s.manifest.name === name1);
    const skill2 = skills.find(s => s.manifest.name === name2);
    
    if (!skill1 || !skill2) {
      res.status(404).json({ success: false, error: 'Skill 未找到' });
      return;
    }
    
    const comparison = compareVersions(skill1.manifest.version, skill2.manifest.version);
    
    res.json({
      success: true,
      data: {
        skill1: skill1.manifest,
        skill2: skill2.manifest,
        comparison: comparison === 1 ? 'newer' : comparison === -1 ? 'older' : 'equal',
        difference: comparison
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// DELETE /api/skills/export/:filename - 删除导出的 Skill
router.delete('/export/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join('./data/exports', filename);
    
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: '文件不存在' });
      return;
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true, data: { message: '删除成功' } });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

export default router;
