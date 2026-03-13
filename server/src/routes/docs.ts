import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { DocumentationGenerator, renderMarkdownToHTML } from '../services/doc-generator';

const router = Router();

// GET /api/docs - 获取文档列表
router.get('/', (req, res) => {
  try {
    const docsDir = './docs';
    
    if (!fs.existsSync(docsDir)) {
      res.json({ 
        success: true, 
        data: { 
          generated: false,
          message: '文档尚未生成，请访问 POST /api/docs/generate 生成文档'
        } 
      });
      return;
    }

    const files = fs.readdirSync(docsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: `/api/docs/file/${f}`,
        htmlPath: `/api/docs/html/${f.replace('.md', '')}`,
        size: fs.statSync(path.join(docsDir, f)).size
      }));

    const skillsDir = path.join(docsDir, 'skills');
    const skillDocs = fs.existsSync(skillsDir) 
      ? fs.readdirSync(skillsDir).filter(f => f.endsWith('.md'))
      : [];

    res.json({
      success: true,
      data: {
        generated: true,
        mainDocs: files,
        skillDocs: skillDocs.map(f => ({
          name: f,
          path: `/api/docs/file/skills/${f}`,
          htmlPath: `/api/docs/html/skills/${f.replace('.md', '')}`
        })),
        generatedAt: fs.statSync(docsDir).mtime.toISOString()
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// POST /api/docs/generate - 生成文档
router.post('/generate', async (req, res) => {
  try {
    const generator = new DocumentationGenerator('./data/skills', './docs');
    const docs = await generator.generateAllDocs();
    
    res.json({
      success: true,
      data: {
        message: '文档生成成功',
        files: [
          'README.md',
          'API_REFERENCE.md',
          'EXAMPLES.md',
          'CHANGELOG.md',
          'skills/*.md'
        ],
        location: './docs'
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/docs/file/:name - 获取 Markdown 文件内容
router.get('/file/:name', (req, res) => {
  try {
    const { name } = req.params;
    const filepath = path.join('./docs', name);
    
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: '文件不存在' });
      return;
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    res.setHeader('Content-Type', 'text/markdown');
    res.send(content);
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/docs/file/skills/:name - 获取 Skill 文档
router.get('/file/skills/:name', (req, res) => {
  try {
    const { name } = req.params;
    const filepath = path.join('./docs/skills', name);
    
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: '文件不存在' });
      return;
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    res.setHeader('Content-Type', 'text/markdown');
    res.send(content);
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/docs/html/:name - 获取 HTML 格式文档
router.get('/html/:name', (req, res) => {
  try {
    const { name } = req.params;
    const filepath = path.join('./docs', `${name}.md`);
    
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: '文件不存在' });
      return;
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    const html = renderMarkdownToHTML(content);
    
    const fullHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - PromptCraft V5 文档</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .nav a { margin-right: 15px; }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/api/docs/html/README">首页</a>
    <a href="/api/docs/html/API_REFERENCE">API</a>
    <a href="/api/docs/html/EXAMPLES">示例</a>
    <a href="/api/docs/html/CHANGELOG">日志</a>
    <a href="/api/docs">索引</a>
  </div>
  ${html}
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(fullHTML);
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/docs/html/skills/:name - 获取 Skill HTML 文档
router.get('/html/skills/:name', (req, res) => {
  try {
    const { name } = req.params;
    const filepath = path.join('./docs/skills', `${name}.md`);
    
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: '文件不存在' });
      return;
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    const html = renderMarkdownToHTML(content);
    
    const fullHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Skill 文档</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre code { background: none; padding: 0; }
    .nav { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .nav a { margin-right: 15px; }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/api/docs/html/README">首页</a>
    <a href="/api/docs/html/API_REFERENCE">API</a>
    <a href="/api/docs">所有文档</a>
  </div>
  ${html}
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(fullHTML);
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

// GET /api/docs/download - 下载完整文档包
router.get('/download', (req, res) => {
  try {
    const docsDir = './docs';
    
    if (!fs.existsSync(docsDir)) {
      res.status(404).json({ success: false, error: '文档尚未生成' });
      return;
    }

    const readmePath = path.join(docsDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      res.download(readmePath, 'PromptCraft-V5-Documentation.md');
    } else {
      res.status(404).json({ success: false, error: 'README 不存在' });
    }
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
    return;
  }
});

export default router;
