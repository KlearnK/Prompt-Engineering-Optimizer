import fs from 'fs/promises';
import path from 'path';
import { Skill, SkillConfig, SkillInput, SkillOutput } from './types';
import { EventEmitter } from 'events';

export class SkillLoader extends EventEmitter {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;
  private watcher?: fs.FileHandle;
  private loadInterval: NodeJS.Timeout | null = null;

  constructor(skillsDir: string = './data/skills') {
    super();
    this.skillsDir = path.resolve(skillsDir);
  }

  async initialize(): Promise<void> {
    // 确保目录存在
    await fs.mkdir(this.skillsDir, { recursive: true });

    // 首次加载
    await this.loadAllSkills();

    // 启动热重载监控（每 3 秒检查一次）
    this.startHotReload();

    console.log(`[SkillLoader] 已加载 ${this.skills.size} 个 Skill`);
  }

  private startHotReload(): void {
    let lastMtime = new Map<string, number>();

    this.loadInterval = setInterval(async () => {
      try {
        const files = await fs.readdir(this.skillsDir);
        const tsFiles = files.filter(f => f.endsWith('.skill.ts') || f.endsWith('.skill.js'));

        let hasChanges = false;

        for (const file of tsFiles) {
          const filePath = path.join(this.skillsDir, file);
          const stats = await fs.stat(filePath);
          const prevMtime = lastMtime.get(file);

          if (!prevMtime || stats.mtimeMs > prevMtime) {
            lastMtime.set(file, stats.mtimeMs);

            // 检查是否是新文件
            const skillId = path.basename(file, path.extname(file)).replace('.skill', '');
            if (!prevMtime) {
              console.log(`[SkillLoader] 发现新 Skill: ${skillId}`);
            } else {
              console.log(`[SkillLoader] Skill 变更: ${skillId}`);
            }

            await this.loadSkill(filePath);
            hasChanges = true;
          }
        }

        // 检查删除的文件
        for (const [file, _] of lastMtime) {
          if (!tsFiles.includes(file)) {
            const skillId = path.basename(file, path.extname(file)).replace('.skill', '');
            this.skills.delete(skillId);
            lastMtime.delete(file);
            console.log(`[SkillLoader] Skill 移除: ${skillId}`);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          this.emit('skillsUpdated', this.getAllConfigs());
        }
      } catch (err) {
        // 目录可能不存在，忽略错误
      }
    }, 3000);
  }

  private async loadAllSkills(): Promise<void> {
    try {
      const files = await fs.readdir(this.skillsDir);
      const skillFiles = files.filter(f => 
        f.endsWith('.skill.ts') || f.endsWith('.skill.js')
      );

      for (const file of skillFiles) {
        await this.loadSkill(path.join(this.skillsDir, file));
      }
    } catch (err) {
      console.log('[SkillLoader] Skills 目录为空，等待创建...');
    }
  }

  private async loadSkill(filePath: string): Promise<void> {
    try {
      // 清除 require 缓存以实现热重载
      delete require.cache[require.resolve(filePath)];

      const skillModule = require(filePath);
      const skill: Skill = skillModule.default || skillModule;

      // 验证 Skill 格式
      if (!this.validateSkill(skill)) {
        console.error(`[SkillLoader] 无效的 Skill 格式: ${filePath}`);
        return;
      }

      const skillId = skill.config.name;
      this.skills.set(skillId, skill);

      console.log(`[SkillLoader] ✅ 加载成功: ${skillId} (${skill.config.displayName})`);
    } catch (err) {
      console.error(`[SkillLoader] ❌ 加载失败 ${filePath}:`, err);
    }
  }

  private validateSkill(skill: any): skill is Skill {
    return (
      skill &&
      typeof skill.config === 'object' &&
      typeof skill.config.name === 'string' &&
      typeof skill.config.displayName === 'string' &&
      typeof skill.config.description === 'string' &&
      typeof skill.config.version === 'string' &&
      Array.isArray(skill.config.tags) &&
      typeof skill.config.priority === 'number' &&
      typeof skill.config.enabled === 'boolean' &&
      typeof skill.execute === 'function'
    );
  }

  // 获取所有 Skill 配置
  getAllConfigs(): SkillConfig[] {
    return Array.from(this.skills.values())
      .filter(s => s.config.enabled)
      .map(s => s.config)
      .sort((a, b) => a.priority - b.priority);
  }

  // 获取单个 Skill
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  // 执行 Skill
  async executeSkill(name: string, input: SkillInput): Promise<SkillOutput | null> {
    const skill = this.skills.get(name);
    if (!skill || !skill.config.enabled) return null;

    // 检查是否适合处理
    if (skill.canHandle) {
      const canHandle = await skill.canHandle(input);
      if (!canHandle) return null;
    }

    const startTime = Date.now();
    const result = await skill.execute(input);

    // 补充元数据
    result.metadata.processingTime = Date.now() - startTime;
    result.metadata.skillName = skill.config.name;

    return result;
  }

  // 自动选择最佳 Skill
  async autoExecute(input: SkillInput): Promise<SkillOutput | null> {
    const enabledSkills = Array.from(this.skills.values())
      .filter(s => s.config.enabled)
      .sort((a, b) => a.config.priority - b.config.priority);

    for (const skill of enabledSkills) {
      // 检查上下文匹配
      if (input.context?.domain && skill.config.tags.includes(input.context.domain)) {
        const result = await this.executeSkill(skill.config.name, input);
        if (result) return result;
      }
    }

    // 如果没有匹配的，使用第一个启用的 Skill
    if (enabledSkills.length > 0) {
      return this.executeSkill(enabledSkills[0].config.name, input);
    }

    return null;
  }

  // 导出 Skill 清单
  async exportManifest(): Promise<string> {
    const manifest = {
      skills: this.getAllConfigs(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const manifestPath = path.join(this.skillsDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    return manifestPath;
  }

  // 清理
  destroy(): void {
    if (this.loadInterval) {
      clearInterval(this.loadInterval);
    }
  }
}
