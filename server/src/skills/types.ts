/**
 * Skill 插件系统类型定义
 * 每个 Skill 是一个独立的提示词优化策略
 */

export interface SkillInput {
  text: string;           // 用户输入的原始提示词
  context?: {             // 可选上下文
    domain?: string;      // 领域：code/writing/translation等
    targetModel?: string; // 目标模型
    userPreference?: string; // 用户偏好风格
  };
}

export interface SkillOutput {
  text: string;           // 优化后的提示词
  metadata: {
    skillName: string;    // 使用的 Skill 名称
    confidence: number;   // 置信度 0-1
    processingTime: number; // 处理耗时(ms)
    suggestions?: string[]; // 额外建议
  };
}

export interface SkillConfig {
  name: string;           // Skill 唯一标识
  displayName: string;    // 显示名称
  description: string;    // 功能描述
  version: string;        // 版本号
  author?: string;        // 作者
  tags: string[];         // 标签：["code", "debug", "creative"]
  supportedModels?: string[]; // 支持的模型，空数组表示全部
  priority: number;       // 优先级，数字越小越优先
  enabled: boolean;       // 是否启用
}

export interface Skill {
  config: SkillConfig;
  execute(input: SkillInput): Promise<SkillOutput> | SkillOutput;
  // 可选：验证输入是否适合此 Skill
  canHandle?(input: SkillInput): boolean | Promise<boolean>;
}

// Skill 清单文件格式（用于分享）
export interface SkillManifest {
  skills: SkillConfig[];
  exportedAt: string;
  version: string;
}
