/**
 * PromptCraft V5 - 完整评估维度与技巧库
 * 移植自 V04 的 6 维评估体系 + 58 个优化技巧
 */

// ==================== 6 维评估维度定义 ====================
export interface EvaluationDimension {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  weight: number; // 权重 (0-1)
  criteria: EvaluationCriteria[];
}

export interface EvaluationCriteria {
  id: string;
  description: string;
  score: number; // 单项满分
}

export const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
  {
    id: 'clarity',
    name: '清晰度',
    nameEn: 'Clarity',
    description: '提示词是否表达清晰、无歧义，目标是否明确',
    weight: 0.2,
    criteria: [
      { id: 'c1', description: '目标明确，无歧义', score: 5 },
      { id: 'c2', description: '语言简洁，避免冗余', score: 5 },
      { id: 'c3', description: '逻辑结构清晰', score: 5 },
      { id: 'c4', description: '专业术语使用准确', score: 5 },
    ]
  },
  {
    id: 'specificity',
    name: '特异性',
    nameEn: 'Specificity',
    description: '提示词是否包含足够的具体细节和约束条件',
    weight: 0.2,
    criteria: [
      { id: 's1', description: '包含具体场景/背景', score: 5 },
      { id: 's2', description: '定义明确的输入/输出格式', score: 5 },
      { id: 's3', description: '指定具体约束条件', score: 5 },
      { id: 's4', description: '提供相关示例', score: 5 },
    ]
  },
  {
    id: 'structure',
    name: '结构性',
    nameEn: 'Structure',
    description: '提示词的组织结构是否合理，层次是否分明',
    weight: 0.15,
    criteria: [
      { id: 'st1', description: '使用标记/分隔符组织内容', score: 5 },
      { id: 'st2', description: '信息分组合理', score: 5 },
      { id: 'st3', description: '优先级排序正确', score: 5 },
      { id: 'st4', description: '使用结构化格式（JSON/XML等）', score: 5 },
    ]
  },
  {
    id: 'completeness',
    name: '完整性',
    nameEn: 'Completeness',
    description: '提示词是否包含完成任务所需的全部信息',
    weight: 0.2,
    criteria: [
      { id: 'co1', description: '提供足够的背景信息', score: 5 },
      { id: 'co2', description: '明确任务边界', score: 5 },
      { id: 'co3', description: '包含必要的上下文', score: 5 },
      { id: 'co4', description: '考虑边缘情况', score: 5 },
    ]
  },
  {
    id: 'tone',
    name: '语气适配',
    nameEn: 'Tone Appropriateness',
    description: '提示词的语气、风格是否与目标场景匹配',
    weight: 0.15,
    criteria: [
      { id: 't1', description: '语气与场景匹配', score: 5 },
      { id: 't2', description: '受众定位准确', score: 5 },
      { id: 't3', description: '情感色彩适当', score: 5 },
      { id: 't4', description: '专业度匹配', score: 5 },
    ]
  },
  {
    id: 'constraints',
    name: '约束性',
    nameEn: 'Constraint Definition',
    description: '提示词是否明确设定了边界条件和限制',
    weight: 0.1,
    criteria: [
      { id: 'cn1', description: '明确长度/格式限制', score: 5 },
      { id: 'cn2', description: '定义质量要求', score: 5 },
      { id: 'cn3', description: '指定禁止事项', score: 5 },
      { id: 'cn4', description: '设定安全边界', score: 5 },
    ]
  }
];

// ==================== 58 个优化技巧库 ====================
export interface OptimizationTechnique {
  id: string;
  category: string;
  name: string;
  description: string;
  example: string;
  applicableDimensions: string[]; // 适用的评估维度ID
  priority: 'high' | 'medium' | 'low';
  autoFixable: boolean; // 是否支持自动修复
}

export const OPTIMIZATION_TECHNIQUES: OptimizationTechnique[] = [
  // ===== 清晰度类技巧 (1-10) =====
  {
    id: 't001',
    category: '清晰度',
    name: '明确角色设定',
    description: '为AI设定明确的角色身份，如"你是一位资深Python工程师"',
    example: '原：帮我写代码\n优：你是有5年经验的Python后端工程师，请帮我编写一个高性能的API接口',
    applicableDimensions: ['clarity', 'specificity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't002',
    category: '清晰度',
    name: '使用动作动词开头',
    description: '以明确的动作动词开始提示词，如"分析"、"生成"、"优化"',
    example: '原：这个代码怎么样\n优：分析以下代码的性能瓶颈，并提供3个优化建议',
    applicableDimensions: ['clarity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't003',
    category: '清晰度',
    name: '消除代词歧义',
    description: '避免使用模糊的代词（这个、那个、它），改用具体名词',
    example: '原：优化它\n优：优化下方的快速排序算法实现',
    applicableDimensions: ['clarity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't004',
    category: '清晰度',
    name: '定义成功标准',
    description: '明确说明什么样的输出被视为"好的结果"',
    example: '原：写个营销文案\n优：撰写一个转化率高于5%的产品描述，要求突出3个核心卖点',
    applicableDimensions: ['clarity', 'constraints'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't005',
    category: '清晰度',
    name: '避免否定句式',
    description: '用正面表述替代"不要..."，明确告诉AI应该做什么',
    example: '原：不要太长\n优：控制在200字以内，分3个要点阐述',
    applicableDimensions: ['clarity', 'constraints'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't006',
    category: '清晰度',
    name: '单一任务原则',
    description: '每个提示词聚焦一个核心任务，复杂任务拆分为多个步骤',
    example: '原：分析并优化这段代码然后写测试\n优：第一步：分析代码的时间复杂度。第二步：针对O(n²)部分进行优化',
    applicableDimensions: ['clarity', 'structure'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't007',
    category: '清晰度',
    name: '量化指标',
    description: '使用具体数字替代模糊形容词（如"一些"、"几个"）',
    example: '原：提供一些例子\n优：提供5个不同场景的使用示例，每个包含输入和输出',
    applicableDimensions: ['clarity', 'specificity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't008',
    category: '清晰度',
    name: '时态统一',
    description: '保持时态一致性，避免混合使用过去/现在/将来时',
    example: '原：用户点击了按钮，系统显示什么？\n优：当用户点击提交按钮时，系统将显示确认弹窗',
    applicableDimensions: ['clarity'],
    priority: 'low',
    autoFixable: true
  },
  {
    id: 't009',
    category: '清晰度',
    name: '术语表前置',
    description: '在提示词开头定义专业术语或缩写',
    example: '原：分析CTR和ROI\n优：术语定义：CTR（点击率）、ROI（投资回报率）。请分析这两个指标的关系',
    applicableDimensions: ['clarity', 'completeness'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't010',
    category: '清晰度',
    name: '输出格式预声明',
    description: '在提问前声明期望的输出格式',
    example: '原：总结会议记录\n优：请以"决策项-负责人-截止时间"的表格形式总结以下会议记录',
    applicableDimensions: ['clarity', 'structure'],
    priority: 'high',
    autoFixable: true
  },

  // ===== 特异性类技巧 (11-20) =====
  {
    id: 't011',
    category: '特异性',
    name: '5W1H 补充法',
    description: '补充Who/What/When/Where/Why/How信息',
    example: '原：写邮件\n优：作为项目经理（Who），给开发团队（To Whom）写一封关于周五截止日（When）的进度提醒邮件',
    applicableDimensions: ['specificity', 'completeness'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't012',
    category: '特异性',
    name: '受众画像',
    description: '明确定义内容的目标受众特征',
    example: '原：解释区块链\n优：向10岁小朋友解释区块链，使用类比和简单语言',
    applicableDimensions: ['specificity', 'tone'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't013',
    category: '特异性',
    name: '场景上下文',
    description: '提供具体的使用场景或业务背景',
    example: '原：优化数据库查询\n优：针对电商大促场景（日活100万），优化订单查询SQL',
    applicableDimensions: ['specificity', 'completeness'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't014',
    category: '特异性',
    name: '输入数据样例',
    description: '提供实际输入数据的格式和样例',
    example: '原：解析日志\n优：解析以下格式的日志：[2024-01-01 10:00:00] ERROR: Connection timeout',
    applicableDimensions: ['specificity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't015',
    category: '特异性',
    name: '输出模板',
    description: '提供期望的输出模板或框架',
    example: '原：写报告\n优：按以下结构撰写：1.执行摘要 2.问题描述 3.解决方案 4.实施计划 5.风险评估',
    applicableDimensions: ['specificity', 'structure'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't016',
    category: '特异性',
    name: '边界条件',
    description: '明确说明特殊情况的处理方式',
    example: '原：计算价格\n优：计算订单总价，如果数量>100打9折，如果VIP用户额外打95折',
    applicableDimensions: ['specificity', 'constraints'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't017',
    category: '特异性',
    name: '参考标准',
    description: '引用行业标准、规范或竞品作为参考',
    example: '原：设计登录页\n优：参考Apple ID登录页的设计风格，遵循WCAG 2.1无障碍标准',
    applicableDimensions: ['specificity'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't018',
    category: '特异性',
    name: '技术栈声明',
    description: '明确指定使用的技术栈或工具版本',
    example: '原：写React代码\n优：使用React 18 + TypeScript，配合Zustand状态管理',
    applicableDimensions: ['specificity'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't019',
    category: '特异性',
    name: '数据范围',
    description: '指定数据的取值范围或有效区间',
    example: '原：生成随机数\n优：生成1000个1-100之间的随机整数，均匀分布',
    applicableDimensions: ['specificity', 'constraints'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't020',
    category: '特异性',
    name: '质量基准',
    description: '提供质量判断的具体基准或参照物',
    example: '原：写高质量代码\n优：代码需通过ESLint检查，测试覆盖率>80%，复杂度<10',
    applicableDimensions: ['specificity', 'constraints'],
    priority: 'high',
    autoFixable: false
  },

  // ===== 结构性类技巧 (21-30) =====
  {
    id: 't021',
    category: '结构性',
    name: 'XML标签分隔',
    description: '使用XML标签组织不同部分的内容',
    example: '<instruction>翻译以下文本</instruction>\n<text>Hello World</text>\n<target>中文</target>',
    applicableDimensions: ['structure', 'clarity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't022',
    category: '结构性',
    name: 'Markdown格式化',
    description: '使用Markdown语法增强结构可读性',
    example: '## 任务\n- 步骤1：分析\n- 步骤2：优化\n- 步骤3：测试',
    applicableDimensions: ['structure'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't023',
    category: '结构性',
    name: 'JSON Schema',
    description: '使用JSON Schema定义输出结构',
    example: '请按以下Schema返回数据：\n{"type":"object","properties":{"title":{"type":"string"}}}',
    applicableDimensions: ['structure', 'specificity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't024',
    category: '结构性',
    name: '步骤编号',
    description: '将复杂任务分解为带编号的步骤序列',
    example: '步骤1：读取文件\n步骤2：解析JSON\n步骤3：验证数据\n步骤4：输出报告',
    applicableDimensions: ['structure', 'clarity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't025',
    category: '结构性',
    name: '分层标题',
    description: '使用多级标题组织信息层次',
    example: '# 需求分析\n## 功能需求\n### 用户注册\n### 用户登录',
    applicableDimensions: ['structure'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't026',
    category: '结构性',
    name: '表格布局',
    description: '使用表格对比或组织多维信息',
    example: '| 方案 | 成本 | 周期 | 风险 |\n| A | 10万 | 1月 | 低 |',
    applicableDimensions: ['structure'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't027',
    category: '结构性',
    name: '代码块包裹',
    description: '使用代码块标记包含代码或命令的部分',
    example: '```python\ndef hello():\n    print("world")\n```',
    applicableDimensions: ['structure', 'clarity'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't028',
    category: '结构性',
    name: '分隔符标记',
    description: '使用特殊分隔符（---、###）区分不同部分',
    example: '--- 背景 ---\n项目背景描述\n--- 需求 ---\n具体功能需求',
    applicableDimensions: ['structure'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't029',
    category: '结构性',
    name: '优先级标记',
    description: '用标签标记内容的优先级（P0/P1/P2）',
    example: '[P0] 核心功能：用户登录\n[P1] 增强功能：社交登录',
    applicableDimensions: ['structure'],
    priority: 'low',
    autoFixable: false
  },
  {
    id: 't030',
    category: '结构性',
    name: '思维链引导',
    description: '要求AI展示推理过程（Chain-of-Thought）',
    example: '请逐步思考：1) 首先分析... 2) 然后考虑... 3) 最后得出结论',
    applicableDimensions: ['structure', 'clarity'],
    priority: 'high',
    autoFixable: true
  },

  // ===== 完整性类技巧 (31-40) =====
  {
    id: 't031',
    category: '完整性',
    name: 'Few-Shot示例',
    description: '提供输入-输出对的示例（少样本学习）',
    example: '示例1：\n输入：苹果\n输出：水果，红色，圆形\n\n现在处理：香蕉',
    applicableDimensions: ['completeness', 'specificity'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't032',
    category: '完整性',
    name: '反例说明',
    description: '提供不希望出现的输出示例',
    example: '正确示例：简洁的技术说明\n错误示例：冗长的营销话术（不要这样）',
    applicableDimensions: ['completeness', 'constraints'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't033',
    category: '完整性',
    name: '资源清单',
    description: '列出可用的资源、工具或数据源',
    example: '可用资源：1) 用户数据库 2) Redis缓存 3) 第三方API（限流1000次/小时）',
    applicableDimensions: ['completeness'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't034',
    category: '完整性',
    name: '依赖关系',
    description: '说明任务间的依赖和前置条件',
    example: '前置条件：已完成用户认证模块。依赖服务：支付网关、短信服务',
    applicableDimensions: ['completeness'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't035',
    category: '完整性',
    name: '历史上下文',
    description: '提供相关的历史决策或变更记录',
    example: '背景：V1版本使用MySQL，V2迁移至PostgreSQL，本次是V3优化',
    applicableDimensions: ['completeness'],
    priority: 'low',
    autoFixable: false
  },
  {
    id: 't036',
    category: '完整性',
    name: '假设声明',
    description: '明确列出前提假设条件',
    example: '假设条件：1) 用户已登录 2) 网络稳定 3) 数据量<10万条',
    applicableDimensions: ['completeness'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't037',
    category: '完整性',
    name: '风险点提示',
    description: '预先指出潜在的风险或难点',
    example: '注意：并发场景下可能出现竞态条件，需要考虑锁机制',
    applicableDimensions: ['completeness'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't038',
    category: '完整性',
    name: '验收标准',
    description: '定义任务完成的具体验收条件',
    example: '验收标准：通过单元测试、集成测试，性能测试QPS>1000',
    applicableDimensions: ['completeness', 'constraints'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't039',
    category: '完整性',
    name: '相关文档',
    description: '引用相关的文档、规范或链接',
    example: '参考文档：API文档(v2.1)、设计稿(Figma)、需求文档(Confluence)',
    applicableDimensions: ['completeness'],
    priority: 'low',
    autoFixable: false
  },
  {
    id: 't040',
    category: '完整性',
    name: 'Fallback策略',
    description: '定义失败时的备用方案',
    example: '如果API超时，使用缓存数据；如果缓存失效，返回友好错误提示',
    applicableDimensions: ['completeness'],
    priority: 'medium',
    autoFixable: false
  },

  // ===== 语气适配类技巧 (41-48) =====
  {
    id: 't041',
    category: '语气适配',
    name: '角色语气卡',
    description: '定义角色的语言风格特征',
    example: '角色语气：专业但不失亲切，使用emoji适当活跃气氛，避免过于学术化',
    applicableDimensions: ['tone'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't042',
    category: '语气适配',
    name: '受众语言层',
    description: '根据受众调整专业术语密度',
    example: '面向高管：聚焦ROI和战略价值，避免技术细节\n面向工程师：包含实现细节和技术选型',
    applicableDimensions: ['tone', 'specificity'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't043',
    category: '语气适配',
    name: '情感调性',
    description: '指定内容的情感色彩（正式/轻松/紧迫等）',
    example: '调性：紧迫但冷静，强调截止日期的同时提供清晰的行动计划',
    applicableDimensions: ['tone'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't044',
    category: '语气适配',
    name: '文化适配',
    description: '考虑文化背景和地域差异',
    example: '面向美国市场：强调个人价值和选择自由\n面向日本市场：强调团队和谐和社会责任',
    applicableDimensions: ['tone'],
    priority: 'low',
    autoFixable: false
  },
  {
    id: 't045',
    category: '语气适配',
    name: '品牌声音',
    description: '匹配品牌的声音特征（年轻/稳重/创新等）',
    example: '品牌声音：像朋友一样可靠，专业但不官僚，鼓励创新思维',
    applicableDimensions: ['tone'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't046',
    category: '语气适配',
    name: '互动模式',
    description: '定义与用户的互动方式（教导式/对话式/顾问式）',
    example: '采用苏格拉底式提问，引导用户自己发现答案，而非直接给出结论',
    applicableDimensions: ['tone'],
    priority: 'low',
    autoFixable: false
  },
  {
    id: 't047',
    category: '语气适配',
    name: '礼貌层级',
    description: '调整礼貌程度（敬语/平语/命令式）',
    example: '对上级：使用敬语和正式称谓\n对平级：友好但专业\n对系统：命令式直接',
    applicableDimensions: ['tone'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't048',
    category: '语气适配',
    name: '叙事视角',
    description: '选择第一/第二/第三人称叙述',
    example: '第一人称（我）：适合个人经验分享\n第二人称（你）：适合指导教程\n第三人称：适合客观报告',
    applicableDimensions: ['tone'],
    priority: 'low',
    autoFixable: false
  },

  // ===== 约束性类技巧 (49-58) =====
  {
    id: 't049',
    category: '约束性',
    name: '长度限制',
    description: '明确指定输出的长度限制',
    example: '限制：回答不超过500字，分3个要点，每点不超过150字',
    applicableDimensions: ['constraints'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't050',
    category: '约束性',
    name: '格式强制',
    description: '强制要求特定的输出格式',
    example: '强制格式：必须以JSON返回，必须包含code/message/data字段',
    applicableDimensions: ['constraints', 'structure'],
    priority: 'high',
    autoFixable: true
  },
  {
    id: 't051',
    category: '约束性',
    name: '内容黑名单',
    description: '明确禁止出现的内容或词汇',
    example: '禁止：1) 使用"绝对"、"肯定"等确定性词汇 2) 提及竞争对手名称',
    applicableDimensions: ['constraints'],
    priority: 'medium',
    autoFixable: true
  },
  {
    id: 't052',
    category: '约束性',
    name: '安全边界',
    description: '设定伦理和安全限制',
    example: '安全要求：不提供医疗建议，不生成恶意代码，保护用户隐私数据',
    applicableDimensions: ['constraints'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't053',
    category: '约束性',
    name: '时间约束',
    description: '指定时间相关的限制条件',
    example: '时间要求：方案必须在2周内实施，考虑Q3预算周期',
    applicableDimensions: ['constraints'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't054',
    category: '约束性',
    name: '资源限制',
    description: '明确资源使用上限',
    example: '资源限制：内存使用<512MB，API调用<100次/天，存储<1GB',
    applicableDimensions: ['constraints'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't055',
    category: '约束性',
    name: '质量门槛',
    description: '设定最低质量标准',
    example: '质量要求：准确率>95%，响应时间<200ms，可用性>99.9%',
    applicableDimensions: ['constraints'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't056',
    category: '约束性',
    name: '版本锁定',
    description: '指定依赖的版本范围',
    example: '版本要求：Node.js 18+，React ^18.2.0，不使用实验性API',
    applicableDimensions: ['constraints'],
    priority: 'medium',
    autoFixable: false
  },
  {
    id: 't057',
    category: '约束性',
    name: '合规要求',
    description: '列出必须遵守的法规或标准',
    example: '合规：符合GDPR数据保护条例，通过ISO27001安全认证',
    applicableDimensions: ['constraints'],
    priority: 'high',
    autoFixable: false
  },
  {
    id: 't058',
    category: '约束性',
    name: '输出验证',
    description: '要求对输出进行自我验证',
    example: '验证：输出前检查是否符合所有约束条件，如不符合请明确说明',
    applicableDimensions: ['constraints'],
    priority: 'medium',
    autoFixable: true
  }
];

// ==================== 评估结果类型定义 ====================
export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  score: number; // 0-100
  maxScore: number;
  feedback: string;
  suggestions: string[];
  applicableTechniques: string[]; // 技巧ID列表
}

export interface EvaluationResult {
  overallScore: number; // 0-100 加权总分
  dimensionScores: DimensionScore[];
  summary: string;
  topIssues: string[];
  recommendedTechniques: OptimizationTechnique[];
  optimizedPrompt?: string; // 自动优化后的提示词
}

// ==================== 辅助函数 ====================
export function getDimensionById(id: string): EvaluationDimension | undefined {
  return EVALUATION_DIMENSIONS.find(d => d.id === id);
}

export function getTechniquesByDimension(dimensionId: string): OptimizationTechnique[] {
  return OPTIMIZATION_TECHNIQUES.filter(t => 
    t.applicableDimensions.includes(dimensionId)
  );
}

export function getTechniqueById(id: string): OptimizationTechnique | undefined {
  return OPTIMIZATION_TECHNIQUES.find(t => t.id === id);
}

export function getAutoFixableTechniques(): OptimizationTechnique[] {
  return OPTIMIZATION_TECHNIQUES.filter(t => t.autoFixable);
}

export function calculateWeightedScore(dimensionScores: DimensionScore[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  dimensionScores.forEach(ds => {
    const dimension = getDimensionById(ds.dimensionId);
    if (dimension) {
      totalWeight += dimension.weight;
      weightedSum += (ds.score / ds.maxScore) * dimension.weight * 100;
    }
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
