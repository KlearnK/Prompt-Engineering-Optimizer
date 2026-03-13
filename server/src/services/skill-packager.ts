import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  email?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  entry: string;  // 入口文件
  config?: Record<string, any>;
}

export interface SkillPackage {
  manifest: SkillManifest;
  code: string;           // 主代码
  readme?: string;        // 说明文档
  examples?: string;      // 使用示例
  icon?: string;          // Base64 图标
}

export class SkillPackager {
  private skillsDir: string;
  private exportsDir: string;

  constructor(skillsDir: string = './data/skills', exportsDir: string = './data/exports') {
    this.skillsDir = skillsDir;
    this.exportsDir = exportsDir;
    this.ensureDir(this.exportsDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 打包 Skill 为 .skill 文件
  async packSkill(skillName: string, options?: {
    author?: string;
    email?: string;
    tags?: string[];
    description?: string;
  }): Promise<string> {
    const skillPath = path.join(this.skillsDir, `${skillName}.skill.js`);

    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill 不存在: ${skillName}`);
    }

    // 读取代码
    const code = fs.readFileSync(skillPath, 'utf-8');

    // 尝试解析已有配置
    const config = this.extractConfig(code);

    // 创建 manifest
    const manifest: SkillManifest = {
      name: skillName,
      version: config?.version || '1.0.0',
      description: options?.description || config?.description || `${skillName} Skill`,
      author: options?.author || config?.author || 'Anonymous',
      email: options?.email,
      tags: options?.tags || config?.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entry: `${skillName}.skill.js`,
      config: config?.config
    };

    // 创建包结构
    const pkg: SkillPackage = {
      manifest,
      code,
      readme: this.generateReadme(manifest),
      examples: config?.examples || ''
    };

    // 生成 .skill 文件（JSON 格式，可改为 ZIP）
    const filename = `${skillName}-v${manifest.version}.skill`;
    const filepath = path.join(this.exportsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(pkg, null, 2), 'utf-8');

    return filepath;
  }

  // 解包 .skill 文件
  async unpackSkill(skillFilePath: string, overwrite: boolean = false): Promise<SkillManifest> {
    if (!fs.existsSync(skillFilePath)) {
      throw new Error(`文件不存在: ${skillFilePath}`);
    }

    const content = fs.readFileSync(skillFilePath, 'utf-8');
    const pkg: SkillPackage = JSON.parse(content);

    // 验证 manifest
    if (!pkg.manifest || !pkg.code) {
      throw new Error('无效的 .skill 文件格式');
    }

    const { manifest } = pkg;
    const targetPath = path.join(this.skillsDir, `${manifest.name}.skill.js`);

    // 检查是否已存在
    if (fs.existsSync(targetPath) && !overwrite) {
      throw new Error(`Skill ${manifest.name} 已存在，请设置 overwrite=true 覆盖`);
    }

    // 写入代码文件
    fs.writeFileSync(targetPath, pkg.code, 'utf-8');

    // 可选：保存 manifest 到单独文件（用于版本管理）
    const manifestPath = path.join(this.skillsDir, `${manifest.name}.manifest.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    return manifest;
  }

  // 验证 Skill 包完整性
  validateSkillPackage(skillFilePath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      if (!fs.existsSync(skillFilePath)) {
        return { valid: false, errors: ['文件不存在'] };
      }

      const content = fs.readFileSync(skillFilePath, 'utf-8');
      const pkg: SkillPackage = JSON.parse(content);

      // 检查必需字段
      if (!pkg.manifest) errors.push('缺少 manifest');
      if (!pkg.code) errors.push('缺少代码');

      if (pkg.manifest) {
        if (!pkg.manifest.name) errors.push('manifest 缺少 name');
        if (!pkg.manifest.version) errors.push('manifest 缺少 version');
        if (!pkg.manifest.entry) errors.push('manifest 缺少 entry');
      }

      // 检查代码是否包含 execute 函数
      if (pkg.code && !pkg.code.includes('execute')) {
        errors.push('代码中未找到 execute 函数');
      }

    } catch (error) {
      errors.push(`解析错误: ${error}`);
    }

    return { valid: errors.length === 0, errors };
  }

  // 获取所有已导出的 Skill
  listExportedSkills(): Array<{
    filename: string;
    manifest: SkillManifest;
    size: number;
    exportedAt: string;
  }> {
    if (!fs.existsSync(this.exportsDir)) {
      return [];
    }

    return fs.readdirSync(this.exportsDir)
      .filter(f => f.endsWith('.skill'))
      .map(filename => {
        const filepath = path.join(this.exportsDir, filename);
        const stats = fs.statSync(filepath);

        try {
          const content = fs.readFileSync(filepath, 'utf-8');
          const pkg: SkillPackage = JSON.parse(content);
          return {
            filename,
            manifest: pkg.manifest,
            size: stats.size,
            exportedAt: pkg.manifest.createdAt
          };
        } catch {
          return {
            filename,
            manifest: {
              name: 'unknown',
              version: 'unknown',
              description: '解析失败',
              tags: [],
              createdAt: stats.birthtime.toISOString(),
              updatedAt: stats.mtime.toISOString(),
              entry: ''
            },
            size: stats.size,
            exportedAt: stats.birthtime.toISOString()
          };
        }
      })
      .sort((a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime());
  }

  // 批量导出所有 Skill
  async exportAllSkills(): Promise<string[]> {
    const exported: string[] = [];

    if (!fs.existsSync(this.skillsDir)) {
      return exported;
    }

    const files = fs.readdirSync(this.skillsDir).filter(f => f.endsWith('.skill.js'));

    for (const file of files) {
      const skillName = file.replace('.skill.js', '');
      try {
        const filepath = await this.packSkill(skillName);
        exported.push(filepath);
      } catch (error) {
        console.error(`导出 ${skillName} 失败:`, error);
      }
    }

    return exported;
  }

  // 从代码中提取配置注释
  private extractConfig(code: string): any {
    const configMatch = code.match(/@config\s*({[\s\S]*?})/);
    if (configMatch) {
      try {
        return JSON.parse(configMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  }

  // 生成 README
  private generateReadme(manifest: SkillManifest): string {
    return `# ${manifest.name}

版本: ${manifest.version}
作者: ${manifest.author || 'Anonymous'}
${manifest.email ? `邮箱: ${manifest.email}\n` : ''}
## 描述

${manifest.description}

## 标签

${manifest.tags.map(t => `- ${t}`).join('\n')}

## 配置

${manifest.config ? `\`\`\`json\n${JSON.stringify(manifest.config, null, 2)}\n\`\`\`` : '无'}

## 安装

将此文件导入 PromptCraft V5 即可使用。
`;
  }
}

// 版本比较工具
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}
