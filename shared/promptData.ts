// ============================================================
// 6 Quality Dimensions
// ============================================================
export const QUALITY_DIMENSIONS = [
  {
    id: "clarity",
    name: "Clarity",
    nameZh: "清晰度",
    description: "Is the prompt unambiguous and easy to understand?",
    descriptionZh: "提示词是否清晰无歧义，易于理解？",
    icon: "Eye",
  },
  {
    id: "specificity",
    name: "Specificity",
    nameZh: "特异性",
    description: "Are requirements and constraints clearly defined?",
    descriptionZh: "需求和约束是否明确定义？",
    icon: "Target",
  },
  {
    id: "structure",
    name: "Structure",
    nameZh: "结构性",
    description: "Does it follow logical organization?",
    descriptionZh: "是否遵循逻辑组织，有明确的层级？",
    icon: "LayoutList",
  },
  {
    id: "completeness",
    name: "Completeness",
    nameZh: "完整性",
    description: "Does it include all necessary context and instructions?",
    descriptionZh: "是否包含所有必要的上下文和指令？",
    icon: "CheckSquare",
  },
  {
    id: "tone",
    name: "Tone",
    nameZh: "语气",
    description: "Is the voice appropriate for the task?",
    descriptionZh: "语气是否适合任务和受众？",
    icon: "MessageSquare",
  },
  {
    id: "constraints",
    name: "Constraints",
    nameZh: "约束性",
    description: "Are boundaries and limitations clear?",
    descriptionZh: "边界和限制是否清晰？",
    icon: "Shield",
  },
] as const;

export type DimensionId = "clarity" | "specificity" | "structure" | "completeness" | "tone" | "constraints";
export type Rating = "Poor" | "Fair" | "Good" | "Excellent";

export interface DimensionScore {
  dimension: DimensionId;
  rating: Rating;
  score: number; // 1-4
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface AssessmentResult {
  dimensions: DimensionScore[];
  overallScore: number;
  overallRating: Rating;
  summary: string;
  topWeaknesses: string[];
  recommendedTechniques: number[]; // technique IDs
}

// ============================================================
// 58 Prompt Optimization Techniques
// ============================================================
export type TechniqueCategory = "reasoning" | "context" | "creative" | "structural" | "output" | "advanced";

export interface Technique {
  id: number;
  name: string;
  nameZh: string;
  category: TechniqueCategory;
  description: string;
  descriptionZh: string;
  usage: string;
  usageZh: string;
  example: string;
  exampleZh: string;
  addressesDimensions: DimensionId[];
}

export const TECHNIQUES: Technique[] = [
  // ── REASONING (1-12) ──────────────────────────────────────
  {
    id: 1, name: "Chain of Thought (CoT)", nameZh: "思维链",
    category: "reasoning",
    description: "Ask the model to show its reasoning step by step before giving a final answer.",
    descriptionZh: "要求模型在给出最终答案前逐步展示其推理过程。",
    usage: "Add 'Think step by step' or 'Show your reasoning' to the prompt.",
    usageZh: "在提示词中添加\"逐步思考\"或\"展示推理过程\"。",
    example: "Solve this math problem step by step: ...",
    exampleZh: "逐步解决这个数学问题：...",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 2, name: "Tree of Thoughts", nameZh: "思维树",
    category: "reasoning",
    description: "Explore multiple reasoning paths simultaneously and evaluate which is best.",
    descriptionZh: "同时探索多条推理路径并评估哪条最佳。",
    usage: "Ask the model to 'consider multiple approaches' and compare them.",
    usageZh: "要求模型\"考虑多种方法\"并进行比较。",
    example: "Consider 3 different approaches to solve this, then pick the best one.",
    exampleZh: "考虑3种不同的解决方法，然后选择最佳方案。",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 3, name: "Decomposition", nameZh: "问题分解",
    category: "reasoning",
    description: "Break complex problems into smaller, manageable sub-problems.",
    descriptionZh: "将复杂问题分解为更小、更易管理的子问题。",
    usage: "Ask the model to first identify sub-tasks, then solve each one.",
    usageZh: "要求模型先识别子任务，然后逐一解决。",
    example: "First, break this task into subtasks. Then solve each subtask.",
    exampleZh: "首先，将此任务分解为子任务，然后逐一解决每个子任务。",
    addressesDimensions: ["structure", "clarity"],
  },
  {
    id: 4, name: "Self-Ask", nameZh: "自我提问",
    category: "reasoning",
    description: "Have the model generate and answer follow-up questions to reach a conclusion.",
    descriptionZh: "让模型生成并回答后续问题以得出结论。",
    usage: "Instruct the model to ask itself clarifying questions before answering.",
    usageZh: "指示模型在回答前先向自己提出澄清问题。",
    example: "Before answering, ask yourself: What do I need to know? What are the key factors?",
    exampleZh: "在回答前，问自己：我需要了解什么？关键因素是什么？",
    addressesDimensions: ["completeness", "clarity"],
  },
  {
    id: 5, name: "Analogical Reasoning", nameZh: "类比推理",
    category: "reasoning",
    description: "Use analogies to explain or solve problems by drawing parallels.",
    descriptionZh: "通过类比来解释或解决问题。",
    usage: "Ask the model to explain using 'similar to' or 'like' comparisons.",
    usageZh: "要求模型使用\"类似于\"或\"就像\"的比较来解释。",
    example: "Explain this concept using an analogy from everyday life.",
    exampleZh: "用日常生活中的类比来解释这个概念。",
    addressesDimensions: ["clarity", "tone"],
  },
  {
    id: 6, name: "Counterfactual Reasoning", nameZh: "反事实推理",
    category: "reasoning",
    description: "Explore 'what if' scenarios to understand causality and alternatives.",
    descriptionZh: "探索\"如果...会怎样\"的场景以理解因果关系和替代方案。",
    usage: "Add 'What if X were different?' or 'How would the outcome change if...'",
    usageZh: "添加\"如果X不同会怎样？\"或\"如果...结果会如何变化\"",
    example: "What would happen if we removed this constraint? How would the solution change?",
    exampleZh: "如果我们移除这个约束会发生什么？解决方案会如何变化？",
    addressesDimensions: ["completeness", "constraints"],
  },
  {
    id: 7, name: "Socratic Method", nameZh: "苏格拉底式方法",
    category: "reasoning",
    description: "Use a series of questions to guide the model toward deeper understanding.",
    descriptionZh: "使用一系列问题引导模型走向更深入的理解。",
    usage: "Structure your prompt as a series of probing questions.",
    usageZh: "将提示词构建为一系列探究性问题。",
    example: "Why is this approach better? What are its limitations? How could it be improved?",
    exampleZh: "为什么这种方法更好？它的局限性是什么？如何改进？",
    addressesDimensions: ["clarity", "completeness"],
  },
  {
    id: 8, name: "Abductive Reasoning", nameZh: "溯因推理",
    category: "reasoning",
    description: "Infer the most likely explanation from incomplete observations.",
    descriptionZh: "从不完整的观察中推断最可能的解释。",
    usage: "Ask the model to identify the most probable cause or explanation.",
    usageZh: "要求模型识别最可能的原因或解释。",
    example: "Given these symptoms/observations, what is the most likely explanation?",
    exampleZh: "给定这些症状/观察，最可能的解释是什么？",
    addressesDimensions: ["completeness", "specificity"],
  },
  {
    id: 9, name: "Inductive Reasoning", nameZh: "归纳推理",
    category: "reasoning",
    description: "Draw general conclusions from specific examples or patterns.",
    descriptionZh: "从具体示例或模式中得出一般性结论。",
    usage: "Provide specific cases and ask the model to identify the general rule.",
    usageZh: "提供具体案例并要求模型识别一般规律。",
    example: "Based on these examples, what general principle can you identify?",
    exampleZh: "基于这些示例，你能识别出什么一般原则？",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 10, name: "Deductive Reasoning", nameZh: "演绎推理",
    category: "reasoning",
    description: "Apply general principles to reach specific conclusions.",
    descriptionZh: "应用一般原则得出具体结论。",
    usage: "State the general rule first, then ask for application to a specific case.",
    usageZh: "先陈述一般规则，然后要求应用到具体情况。",
    example: "Given that [general rule], and that [specific fact], what can we conclude?",
    exampleZh: "鉴于[一般规则]，以及[具体事实]，我们能得出什么结论？",
    addressesDimensions: ["structure", "constraints"],
  },
  {
    id: 11, name: "Metacognitive Prompting", nameZh: "元认知提示",
    category: "reasoning",
    description: "Ask the model to reflect on its own thinking and confidence level.",
    descriptionZh: "要求模型反思自己的思维过程和置信水平。",
    usage: "Add 'How confident are you?' or 'What assumptions are you making?'",
    usageZh: "添加\"你有多确信？\"或\"你做了哪些假设？\"",
    example: "After answering, reflect: How confident are you? What might you be wrong about?",
    exampleZh: "回答后，反思：你有多确信？你可能在哪些方面有误？",
    addressesDimensions: ["completeness", "constraints"],
  },
  {
    id: 12, name: "Constraint Satisfaction", nameZh: "约束满足",
    category: "reasoning",
    description: "Explicitly list all constraints and verify the solution meets each one.",
    descriptionZh: "明确列出所有约束并验证解决方案满足每个约束。",
    usage: "List constraints explicitly and ask the model to check each one.",
    usageZh: "明确列出约束并要求模型逐一检查。",
    example: "Solution must satisfy: [constraint 1], [constraint 2]. Verify each is met.",
    exampleZh: "解决方案必须满足：[约束1]，[约束2]。验证每个约束是否满足。",
    addressesDimensions: ["constraints", "completeness"],
  },

  // ── CONTEXT (13-24) ───────────────────────────────────────
  {
    id: 13, name: "Few-Shot Learning", nameZh: "少样本学习",
    category: "context",
    description: "Provide 2-5 examples to teach the model the desired pattern or format.",
    descriptionZh: "提供2-5个示例以教导模型所需的模式或格式。",
    usage: "Include 'Example 1: ... Example 2: ... Now do the same for: ...'",
    usageZh: "包含\"示例1：... 示例2：... 现在对以下内容做同样的事：...\"",
    example: "Example: Input: cat → Output: feline. Input: dog → Output: canine. Now: rabbit →",
    exampleZh: "示例：输入：猫 → 输出：猫科动物。输入：狗 → 输出：犬科动物。现在：兔子 →",
    addressesDimensions: ["clarity", "specificity"],
  },
  {
    id: 14, name: "Zero-Shot Prompting", nameZh: "零样本提示",
    category: "context",
    description: "Give clear instructions without examples, relying on the model's training.",
    descriptionZh: "在没有示例的情况下给出清晰的指令，依赖模型的训练。",
    usage: "Write detailed, precise instructions that fully specify the task.",
    usageZh: "编写详细、精确的指令，完整指定任务。",
    example: "Classify the sentiment of the following text as positive, negative, or neutral: ...",
    exampleZh: "将以下文本的情感分类为积极、消极或中性：...",
    addressesDimensions: ["clarity", "specificity"],
  },
  {
    id: 15, name: "Self-Consistency", nameZh: "自一致性",
    category: "context",
    description: "Generate multiple solutions and select the most consistent answer.",
    descriptionZh: "生成多个解决方案并选择最一致的答案。",
    usage: "Ask for multiple approaches and have the model identify the best one.",
    usageZh: "要求多种方法并让模型识别最佳方案。",
    example: "Generate 3 different solutions, then identify which is most reliable.",
    exampleZh: "生成3种不同的解决方案，然后确定哪种最可靠。",
    addressesDimensions: ["completeness", "structure"],
  },
  {
    id: 16, name: "Reflection", nameZh: "反思",
    category: "context",
    description: "Ask the model to review and critique its own output for improvement.",
    descriptionZh: "要求模型审查并批评自己的输出以进行改进。",
    usage: "Add 'Review your answer and improve it' after the initial response.",
    usageZh: "在初始回答后添加\"审查你的答案并改进它\"。",
    example: "Write a response, then critically review it and provide an improved version.",
    exampleZh: "写一个回答，然后批判性地审查它并提供改进版本。",
    addressesDimensions: ["completeness", "clarity"],
  },
  {
    id: 17, name: "Contextual Priming", nameZh: "上下文预热",
    category: "context",
    description: "Provide relevant background information to set the stage for the task.",
    descriptionZh: "提供相关背景信息为任务做铺垫。",
    usage: "Start with 'Context: ...' or 'Background: ...' before the main request.",
    usageZh: "在主要请求前以\"背景：...\"或\"上下文：...\"开头。",
    example: "Context: This is for a B2B SaaS startup targeting enterprise clients. Task: ...",
    exampleZh: "背景：这是针对企业客户的B2B SaaS初创公司。任务：...",
    addressesDimensions: ["completeness", "specificity"],
  },
  {
    id: 18, name: "Audience Specification", nameZh: "受众规范",
    category: "context",
    description: "Explicitly define who the output is intended for.",
    descriptionZh: "明确定义输出的目标受众。",
    usage: "Add 'Write for [audience]' or 'Assume the reader is [description]'.",
    usageZh: "添加\"为[受众]写作\"或\"假设读者是[描述]\"。",
    example: "Explain this concept to a 10-year-old with no technical background.",
    exampleZh: "向一个没有技术背景的10岁孩子解释这个概念。",
    addressesDimensions: ["tone", "clarity"],
  },
  {
    id: 19, name: "Goal Statement", nameZh: "目标陈述",
    category: "context",
    description: "Clearly state the ultimate goal or desired outcome of the task.",
    descriptionZh: "清晰陈述任务的最终目标或期望结果。",
    usage: "Begin with 'My goal is to...' or 'The desired outcome is...'",
    usageZh: "以\"我的目标是...\"或\"期望的结果是...\"开头。",
    example: "Goal: Increase user engagement by 20%. Task: Suggest 5 UI improvements.",
    exampleZh: "目标：将用户参与度提高20%。任务：建议5个UI改进方案。",
    addressesDimensions: ["completeness", "clarity"],
  },
  {
    id: 20, name: "Success Criteria", nameZh: "成功标准",
    category: "context",
    description: "Define what a successful response looks like before asking.",
    descriptionZh: "在提问前定义成功回答的样子。",
    usage: "Add 'A good answer will...' or 'Success means...' to your prompt.",
    usageZh: "在提示词中添加\"好的答案将...\"或\"成功意味着...\"。",
    example: "A good solution will be under 100 lines, handle edge cases, and include comments.",
    exampleZh: "好的解决方案将少于100行，处理边缘情况，并包含注释。",
    addressesDimensions: ["constraints", "completeness"],
  },
  {
    id: 21, name: "Negative Examples", nameZh: "反例",
    category: "context",
    description: "Show what you do NOT want to help the model avoid common mistakes.",
    descriptionZh: "展示你不想要的内容以帮助模型避免常见错误。",
    usage: "Add 'Do NOT do this: [example]' or 'Avoid: [pattern]'.",
    usageZh: "添加\"不要这样做：[示例]\"或\"避免：[模式]\"。",
    example: "Do NOT use jargon. Bad example: 'Leverage synergies.' Good: 'Work together.'",
    exampleZh: "不要使用行话。坏示例：\"利用协同效应。\"好示例：\"共同合作。\"",
    addressesDimensions: ["clarity", "constraints"],
  },
  {
    id: 22, name: "Domain Knowledge Injection", nameZh: "领域知识注入",
    category: "context",
    description: "Provide specialized domain knowledge the model should use.",
    descriptionZh: "提供模型应该使用的专业领域知识。",
    usage: "Include relevant facts, rules, or terminology before the main task.",
    usageZh: "在主要任务前包含相关事实、规则或术语。",
    example: "In React, components re-render when state changes. Given this, explain why...",
    exampleZh: "在React中，当状态改变时组件会重新渲染。鉴于此，解释为什么...",
    addressesDimensions: ["completeness", "specificity"],
  },
  {
    id: 23, name: "Temporal Context", nameZh: "时间背景",
    category: "context",
    description: "Specify the time period or recency requirements for the response.",
    descriptionZh: "指定回答的时间段或时效性要求。",
    usage: "Add 'As of [year]' or 'Using current best practices' to your prompt.",
    usageZh: "在提示词中添加\"截至[年份]\"或\"使用当前最佳实践\"。",
    example: "Using 2024 React best practices, refactor this component...",
    exampleZh: "使用2024年React最佳实践，重构这个组件...",
    addressesDimensions: ["specificity", "completeness"],
  },
  {
    id: 24, name: "Comparative Context", nameZh: "比较背景",
    category: "context",
    description: "Provide comparison points to help the model calibrate its response.",
    descriptionZh: "提供比较点以帮助模型校准其回答。",
    usage: "Add 'Compared to [X], this should be...' or 'Unlike [Y], focus on...'",
    usageZh: "添加\"与[X]相比，这应该是...\"或\"与[Y]不同，专注于...\"",
    example: "Unlike a casual blog post, this technical doc should be precise and formal.",
    exampleZh: "与休闲博客文章不同，这份技术文档应该精确且正式。",
    addressesDimensions: ["specificity", "tone"],
  },

  // ── CREATIVE (25-36) ──────────────────────────────────────
  {
    id: 25, name: "Role-Play", nameZh: "角色扮演",
    category: "creative",
    description: "Assign the model a specific expert role to shape its perspective.",
    descriptionZh: "为模型分配特定的专家角色以塑造其视角。",
    usage: "Start with 'You are a [role]...' or 'Act as a [expert]...'",
    usageZh: "以\"你是一位[角色]...\"或\"扮演一位[专家]...\"开头。",
    example: "You are a senior UX designer with 10 years of experience. Review this design...",
    exampleZh: "你是一位有10年经验的高级UX设计师。审查这个设计...",
    addressesDimensions: ["tone", "specificity"],
  },
  {
    id: 26, name: "Persona Definition", nameZh: "人物设定",
    category: "creative",
    description: "Create a detailed character with specific traits, background, and expertise.",
    descriptionZh: "创建一个具有特定特征、背景和专业知识的详细角色。",
    usage: "Define the persona's background, expertise, communication style, and values.",
    usageZh: "定义角色的背景、专业知识、沟通风格和价值观。",
    example: "You are Dr. Sarah Chen, a pragmatic data scientist who values clarity over complexity.",
    exampleZh: "你是陈莎拉博士，一位重视清晰胜于复杂性的务实数据科学家。",
    addressesDimensions: ["tone", "specificity"],
  },
  {
    id: 27, name: "Scenario Framing", nameZh: "场景框架",
    category: "creative",
    description: "Set a specific scenario or situation to ground the response.",
    descriptionZh: "设置特定场景或情境以使回答更具针对性。",
    usage: "Describe the situation: 'Imagine you are in a meeting where...'",
    usageZh: "描述情境：\"想象你在一个会议中，其中...\"",
    example: "Imagine you're a startup founder pitching to skeptical investors. Write your pitch.",
    exampleZh: "想象你是一个向怀疑的投资者推销的初创公司创始人。写你的推销词。",
    addressesDimensions: ["completeness", "specificity"],
  },
  {
    id: 28, name: "Brainstorming Mode", nameZh: "头脑风暴模式",
    category: "creative",
    description: "Encourage divergent thinking to generate many ideas without judgment.",
    descriptionZh: "鼓励发散性思维，无需评判地生成许多想法。",
    usage: "Add 'Generate as many ideas as possible' or 'No idea is too wild'.",
    usageZh: "添加\"尽可能多地生成想法\"或\"没有想法太疯狂\"。",
    example: "Brainstorm 20 creative ways to increase user retention, no matter how unconventional.",
    exampleZh: "头脑风暴20种提高用户留存率的创意方法，无论多么非传统。",
    addressesDimensions: ["completeness", "structure"],
  },
  {
    id: 29, name: "Perspective Shifting", nameZh: "视角转换",
    category: "creative",
    description: "Ask the model to view the problem from multiple different perspectives.",
    descriptionZh: "要求模型从多个不同视角看待问题。",
    usage: "Add 'From the perspective of [stakeholder], how would you...'",
    usageZh: "添加\"从[利益相关者]的角度来看，你会如何...\"",
    example: "Analyze this feature from the user's, developer's, and business's perspectives.",
    exampleZh: "从用户、开发者和业务的角度分析这个功能。",
    addressesDimensions: ["completeness", "tone"],
  },
  {
    id: 30, name: "SCAMPER Technique", nameZh: "SCAMPER技术",
    category: "creative",
    description: "Apply Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse.",
    descriptionZh: "应用替代、组合、适应、修改、他用、消除、反转。",
    usage: "Ask the model to apply SCAMPER to improve an existing idea or product.",
    usageZh: "要求模型应用SCAMPER来改进现有想法或产品。",
    example: "Apply SCAMPER to improve this product: What can be substituted? Combined?...",
    exampleZh: "应用SCAMPER改进这个产品：什么可以被替代？组合？...",
    addressesDimensions: ["completeness", "structure"],
  },
  {
    id: 31, name: "Worst-Case Analysis", nameZh: "最坏情况分析",
    category: "creative",
    description: "Explore potential failures and edge cases to strengthen the solution.",
    descriptionZh: "探索潜在的失败和边缘情况以加强解决方案。",
    usage: "Ask 'What could go wrong?' or 'What are the edge cases?'",
    usageZh: "询问\"什么可能出错？\"或\"边缘情况是什么？\"",
    example: "After proposing the solution, identify the top 5 ways it could fail.",
    exampleZh: "提出解决方案后，识别它可能失败的前5种方式。",
    addressesDimensions: ["completeness", "constraints"],
  },
  {
    id: 32, name: "Devil's Advocate", nameZh: "唱反调",
    category: "creative",
    description: "Argue against the proposed solution to find weaknesses.",
    descriptionZh: "反对提出的解决方案以找出弱点。",
    usage: "Ask the model to 'argue against this idea' or 'find flaws in this approach'.",
    usageZh: "要求模型\"反对这个想法\"或\"找出这种方法的缺陷\"。",
    example: "Now argue against your own solution. What are its weaknesses?",
    exampleZh: "现在反对你自己的解决方案。它的弱点是什么？",
    addressesDimensions: ["completeness", "constraints"],
  },
  {
    id: 33, name: "Empathy Mapping", nameZh: "同理心映射",
    category: "creative",
    description: "Understand user feelings, thoughts, and behaviors to inform the response.",
    descriptionZh: "了解用户的感受、想法和行为以指导回答。",
    usage: "Ask the model to consider 'What does the user think/feel/see/do?'",
    usageZh: "要求模型考虑\"用户思考/感受/看到/做什么？\"",
    example: "Map the user's journey: What are they thinking, feeling, and doing at each step?",
    exampleZh: "绘制用户旅程：他们在每个步骤中思考、感受和做什么？",
    addressesDimensions: ["completeness", "tone"],
  },
  {
    id: 34, name: "Lateral Thinking", nameZh: "横向思维",
    category: "creative",
    description: "Approach problems from unexpected angles to find innovative solutions.",
    descriptionZh: "从意想不到的角度处理问题以找到创新解决方案。",
    usage: "Ask 'What unconventional approaches could work?' or 'Think outside the box.'",
    usageZh: "询问\"什么非传统方法可能有效？\"或\"跳出框框思考。\"",
    example: "Ignore conventional solutions. What completely different approach could solve this?",
    exampleZh: "忽略传统解决方案。什么完全不同的方法可以解决这个问题？",
    addressesDimensions: ["completeness", "structure"],
  },
  {
    id: 35, name: "Narrative Framing", nameZh: "叙事框架",
    category: "creative",
    description: "Use storytelling to make complex information more engaging and memorable.",
    descriptionZh: "使用讲故事的方式使复杂信息更具吸引力和记忆性。",
    usage: "Ask the model to 'tell a story about' or 'explain through a narrative'.",
    usageZh: "要求模型\"讲述关于...的故事\"或\"通过叙事解释\"。",
    example: "Explain this technical concept through a story about a character who needs to solve it.",
    exampleZh: "通过一个需要解决它的角色的故事来解释这个技术概念。",
    addressesDimensions: ["clarity", "tone"],
  },
  {
    id: 36, name: "Future Visioning", nameZh: "未来愿景",
    category: "creative",
    description: "Project into the future to envision ideal states and work backward.",
    descriptionZh: "投射到未来以设想理想状态并向后工作。",
    usage: "Ask 'Imagine it's 5 years from now and this succeeded. What happened?'",
    usageZh: "询问\"想象5年后这成功了。发生了什么？\"",
    example: "Imagine the perfect version of this product in 3 years. Describe it in detail.",
    exampleZh: "想象3年后这个产品的完美版本。详细描述它。",
    addressesDimensions: ["completeness", "specificity"],
  },

  // ── STRUCTURAL (37-48) ────────────────────────────────────
  {
    id: 37, name: "Template-Based Prompting", nameZh: "模板化提示",
    category: "structural",
    description: "Use a predefined template to ensure consistent, complete responses.",
    descriptionZh: "使用预定义模板确保一致、完整的回答。",
    usage: "Provide a fill-in-the-blank template for the model to complete.",
    usageZh: "提供一个填空模板供模型完成。",
    example: "Fill in this template: Product: [name]. Problem: [issue]. Solution: [approach].",
    exampleZh: "填写此模板：产品：[名称]。问题：[问题]。解决方案：[方法]。",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 38, name: "Framework Application", nameZh: "框架应用",
    category: "structural",
    description: "Apply a known analytical framework (SWOT, 5W1H, STAR, etc.).",
    descriptionZh: "应用已知的分析框架（SWOT、5W1H、STAR等）。",
    usage: "Specify the framework: 'Analyze using the SWOT framework...'",
    usageZh: "指定框架：\"使用SWOT框架分析...\"",
    example: "Analyze this business idea using the SWOT framework (Strengths, Weaknesses, Opportunities, Threats).",
    exampleZh: "使用SWOT框架分析这个商业想法（优势、劣势、机会、威胁）。",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 39, name: "Numbered Steps", nameZh: "编号步骤",
    category: "structural",
    description: "Request output as a numbered list of sequential steps.",
    descriptionZh: "要求输出为顺序步骤的编号列表。",
    usage: "Add 'Provide step-by-step instructions numbered 1, 2, 3...'",
    usageZh: "添加\"提供编号为1、2、3的分步骤说明...\"",
    example: "Provide step-by-step instructions to set up a React project from scratch.",
    exampleZh: "提供从头开始设置React项目的分步骤说明。",
    addressesDimensions: ["structure", "clarity"],
  },
  {
    id: 40, name: "Hierarchical Structure", nameZh: "层级结构",
    category: "structural",
    description: "Organize information in a clear hierarchy with main points and sub-points.",
    descriptionZh: "以清晰的层级结构组织信息，包含主要点和子点。",
    usage: "Request 'Use headers, subheaders, and bullet points to organize...'",
    usageZh: "要求\"使用标题、副标题和要点来组织...\"",
    example: "Organize this information with H1 sections, H2 subsections, and bullet details.",
    exampleZh: "用H1节、H2子节和要点详情组织这些信息。",
    addressesDimensions: ["structure", "clarity"],
  },
  {
    id: 41, name: "Checklist Format", nameZh: "检查清单格式",
    category: "structural",
    description: "Request output as an actionable checklist for easy verification.",
    descriptionZh: "要求输出为可操作的检查清单，便于验证。",
    usage: "Add 'Format as a checklist with checkboxes [ ]'.",
    usageZh: "添加\"格式化为带复选框[ ]的检查清单\"。",
    example: "Create a deployment checklist with checkboxes for each required step.",
    exampleZh: "创建一个部署检查清单，每个必要步骤都有复选框。",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 42, name: "Table Format", nameZh: "表格格式",
    category: "structural",
    description: "Request information organized in a table for easy comparison.",
    descriptionZh: "要求信息以表格形式组织，便于比较。",
    usage: "Add 'Present this as a table with columns: [col1], [col2]...'",
    usageZh: "添加\"以表格形式呈现，列为：[列1]、[列2]...\"",
    example: "Compare these 3 frameworks in a table: Performance, Learning Curve, Community.",
    exampleZh: "在表格中比较这3个框架：性能、学习曲线、社区。",
    addressesDimensions: ["structure", "clarity"],
  },
  {
    id: 43, name: "Length Specification", nameZh: "长度规范",
    category: "structural",
    description: "Explicitly specify the desired length or word count of the response.",
    descriptionZh: "明确指定回答的期望长度或字数。",
    usage: "Add 'In [X] words/sentences/paragraphs' or 'Keep it under [X] words'.",
    usageZh: "添加\"用[X]个词/句子/段落\"或\"保持在[X]个词以内\"。",
    example: "Summarize this article in exactly 3 sentences.",
    exampleZh: "用恰好3句话总结这篇文章。",
    addressesDimensions: ["constraints", "specificity"],
  },
  {
    id: 44, name: "Format Specification", nameZh: "格式规范",
    category: "structural",
    description: "Specify the exact output format (JSON, Markdown, code, prose, etc.).",
    descriptionZh: "指定确切的输出格式（JSON、Markdown、代码、散文等）。",
    usage: "Add 'Return as JSON with keys: ...' or 'Format as Markdown'.",
    usageZh: "添加\"以JSON格式返回，键为：...\"或\"格式化为Markdown\"。",
    example: "Return the data as valid JSON with keys: name, age, email, role.",
    exampleZh: "以有效的JSON格式返回数据，键为：name、age、email、role。",
    addressesDimensions: ["constraints", "specificity"],
  },
  {
    id: 45, name: "Section Labeling", nameZh: "章节标记",
    category: "structural",
    description: "Use clear labels for different sections to improve navigability.",
    descriptionZh: "使用清晰的标签标记不同章节以提高可导航性。",
    usage: "Ask for sections labeled: [ANALYSIS], [RECOMMENDATION], [NEXT STEPS].",
    usageZh: "要求标记章节：[分析]、[建议]、[下一步]。",
    example: "Structure your response with these sections: [PROBLEM], [SOLUTION], [RISKS].",
    exampleZh: "用这些章节构建你的回答：[问题]、[解决方案]、[风险]。",
    addressesDimensions: ["structure", "clarity"],
  },
  {
    id: 46, name: "Priority Ordering", nameZh: "优先级排序",
    category: "structural",
    description: "Ask for items ordered by importance, impact, or urgency.",
    descriptionZh: "要求按重要性、影响力或紧迫性排序的项目。",
    usage: "Add 'Order by priority (most important first)' or 'Rank by impact'.",
    usageZh: "添加\"按优先级排序（最重要的在前）\"或\"按影响力排名\"。",
    example: "List these recommendations ordered by potential impact (highest first).",
    exampleZh: "按潜在影响力（最高在前）排列这些建议。",
    addressesDimensions: ["structure", "specificity"],
  },
  {
    id: 47, name: "Conditional Logic", nameZh: "条件逻辑",
    category: "structural",
    description: "Use if-then conditions to handle different scenarios in one prompt.",
    descriptionZh: "使用if-then条件在一个提示词中处理不同场景。",
    usage: "Add 'If [condition], then [action]. Otherwise, [alternative].'",
    usageZh: "添加\"如果[条件]，则[行动]。否则，[替代方案]。\"",
    example: "If the code has errors, fix them. If it's correct, optimize it for performance.",
    exampleZh: "如果代码有错误，修复它们。如果正确，则优化性能。",
    addressesDimensions: ["constraints", "completeness"],
  },
  {
    id: 48, name: "Parallel Structure", nameZh: "并行结构",
    category: "structural",
    description: "Ensure all items in a list follow the same grammatical structure.",
    descriptionZh: "确保列表中的所有项目遵循相同的语法结构。",
    usage: "Add 'Use parallel structure for all list items' or 'Start each point with a verb'.",
    usageZh: "添加\"所有列表项使用并行结构\"或\"每个要点以动词开头\"。",
    example: "List 5 benefits, each starting with an action verb (e.g., 'Reduces...', 'Improves...').",
    exampleZh: "列出5个优点，每个以动作动词开头（如\"减少...\"、\"改善...\"）。",
    addressesDimensions: ["structure", "clarity"],
  },

  // ── OUTPUT (49-54) ────────────────────────────────────────
  {
    id: 49, name: "Output Validation", nameZh: "输出验证",
    category: "output",
    description: "Ask the model to verify its output meets specified criteria.",
    descriptionZh: "要求模型验证其输出是否满足指定标准。",
    usage: "Add 'Before finishing, verify that your response: [criteria list]'.",
    usageZh: "添加\"完成前，验证你的回答：[标准列表]\"。",
    example: "Before submitting, verify: Is it under 200 words? Does it answer all 3 questions?",
    exampleZh: "提交前，验证：是否少于200字？是否回答了所有3个问题？",
    addressesDimensions: ["completeness", "constraints"],
  },
  {
    id: 50, name: "Iterative Refinement", nameZh: "迭代改进",
    category: "output",
    description: "Request multiple rounds of improvement on the same output.",
    descriptionZh: "要求对同一输出进行多轮改进。",
    usage: "Ask for 'Version 1, then improve it to Version 2, then Version 3'.",
    usageZh: "要求\"版本1，然后改进到版本2，然后版本3\"。",
    example: "Write a draft, then improve it for clarity, then improve it for conciseness.",
    exampleZh: "写一个草稿，然后改进清晰度，然后改进简洁性。",
    addressesDimensions: ["completeness", "clarity"],
  },
  {
    id: 51, name: "Confidence Scoring", nameZh: "置信度评分",
    category: "output",
    description: "Ask the model to rate its confidence in each part of the response.",
    descriptionZh: "要求模型对回答的每个部分评定置信度。",
    usage: "Add 'Rate your confidence (1-10) for each claim you make'.",
    usageZh: "添加\"对你所做的每个声明评定置信度（1-10）\"。",
    example: "For each recommendation, rate your confidence (1-10) and explain why.",
    exampleZh: "对每个建议，评定你的置信度（1-10）并解释原因。",
    addressesDimensions: ["completeness", "constraints"],
  },
  {
    id: 52, name: "Alternative Generation", nameZh: "替代方案生成",
    category: "output",
    description: "Request multiple alternative versions to choose from.",
    descriptionZh: "要求生成多个替代版本以供选择。",
    usage: "Ask for '3 different versions: formal, casual, and technical'.",
    usageZh: "要求\"3个不同版本：正式、休闲和技术性\"。",
    example: "Write 3 versions of this headline: one emotional, one logical, one humorous.",
    exampleZh: "写这个标题的3个版本：一个情感性的、一个逻辑性的、一个幽默的。",
    addressesDimensions: ["completeness", "specificity"],
  },
  {
    id: 53, name: "Explanation Requirement", nameZh: "解释要求",
    category: "output",
    description: "Require the model to explain its choices and reasoning.",
    descriptionZh: "要求模型解释其选择和推理。",
    usage: "Add 'Explain why you made each decision' or 'Justify your choices'.",
    usageZh: "添加\"解释你为什么做出每个决定\"或\"证明你的选择合理\"。",
    example: "Provide the solution and explain why you chose this approach over alternatives.",
    exampleZh: "提供解决方案并解释为什么选择这种方法而不是替代方案。",
    addressesDimensions: ["clarity", "completeness"],
  },
  {
    id: 54, name: "Summary First", nameZh: "先摘要",
    category: "output",
    description: "Ask for a brief summary before the detailed response.",
    descriptionZh: "在详细回答前要求简短摘要。",
    usage: "Add 'Start with a 1-sentence summary, then provide details'.",
    usageZh: "添加\"从1句话摘要开始，然后提供详细信息\"。",
    example: "Begin with a TL;DR summary, then explain in detail.",
    exampleZh: "以TL;DR摘要开始，然后详细解释。",
    addressesDimensions: ["structure", "clarity"],
  },

  // ── ADVANCED (55-58) ──────────────────────────────────────
  {
    id: 55, name: "Prompt Chaining", nameZh: "提示词链接",
    category: "advanced",
    description: "Break complex tasks into a chain of simpler prompts, each building on the last.",
    descriptionZh: "将复杂任务分解为一系列简单提示词，每个都建立在上一个的基础上。",
    usage: "Design a sequence: 'First do X, use that output to do Y, then do Z'.",
    usageZh: "设计一个序列：\"首先做X，用该输出做Y，然后做Z\"。",
    example: "Step 1: Outline the article. Step 2: Write each section. Step 3: Edit for flow.",
    exampleZh: "步骤1：概述文章。步骤2：写每个部分。步骤3：编辑流畅性。",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 56, name: "Instruction Scaffolding", nameZh: "指令脚手架",
    category: "advanced",
    description: "Layer instructions from general to specific, building complexity gradually.",
    descriptionZh: "从一般到具体地叠加指令，逐渐增加复杂性。",
    usage: "Start with the overall goal, then add constraints, then add specific details.",
    usageZh: "从总体目标开始，然后添加约束，然后添加具体细节。",
    example: "Task: Write an email. Constraint: Professional tone. Detail: Mention Q3 results.",
    exampleZh: "任务：写一封电子邮件。约束：专业语气。细节：提及Q3结果。",
    addressesDimensions: ["structure", "completeness"],
  },
  {
    id: 57, name: "Multi-Modal Prompting", nameZh: "多模态提示",
    category: "advanced",
    description: "Combine text with descriptions of images, data, or other modalities.",
    descriptionZh: "将文本与图像、数据或其他模态的描述结合起来。",
    usage: "Describe visual elements: 'The chart shows... The image depicts...'",
    usageZh: "描述视觉元素：\"图表显示...图像描绘...\"",
    example: "Based on this chart showing [description], identify the key trend and explain it.",
    exampleZh: "基于这个显示[描述]的图表，识别关键趋势并解释它。",
    addressesDimensions: ["completeness", "specificity"],
  },
  {
    id: 58, name: "Recursive Improvement", nameZh: "递归改进",
    category: "advanced",
    description: "Have the model evaluate and improve its own output in a feedback loop.",
    descriptionZh: "让模型在反馈循环中评估和改进自己的输出。",
    usage: "Ask the model to 'score your response, then improve it based on that score'.",
    usageZh: "要求模型\"对你的回答评分，然后根据该分数改进它\"。",
    example: "Write a response, rate it 1-10, identify weaknesses, then write an improved version.",
    exampleZh: "写一个回答，评分1-10，识别弱点，然后写一个改进版本。",
    addressesDimensions: ["completeness", "clarity"],
  },
];

// ============================================================
// Prompt Templates
// ============================================================
export interface PromptTemplate {
  id: string;
  title: string;
  titleZh: string;
  category: string;
  categoryZh: string;
  description: string;
  descriptionZh: string;
  template: string;
  tags: string[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "ui-login",
    title: "Login Page Design",
    titleZh: "登录页面设计",
    category: "UI/UX Design",
    categoryZh: "UI/UX设计",
    description: "Generate a polished login page prompt",
    descriptionZh: "生成精美的登录页面提示词",
    template: `A clean, trustworthy login page with a centered form and subtle branding.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light, minimal, professional
- Background: Clean White (#ffffff)
- Surface: Soft Gray (#f9fafb) for form card
- Primary Accent: Deep Blue (#2563eb) for submit button and links
- Text Primary: Near Black (#111827) for headings
- Text Secondary: Medium Gray (#6b7280) for labels
- Buttons: Subtly rounded (8px), full-width on form
- Cards: Gently rounded (12px), soft shadow for elevation

**Page Structure:**
1. **Header:** Minimal logo, centered
2. **Login Card:** Centered form with email, password fields, "Forgot password?" link
3. **Submit Button:** Primary blue "Sign In" button
4. **Footer:** "Don't have an account? Sign up" link`,
    tags: ["login", "auth", "form", "ui"],
  },
  {
    id: "ui-dashboard",
    title: "Analytics Dashboard",
    titleZh: "数据分析仪表板",
    category: "UI/UX Design",
    categoryZh: "UI/UX设计",
    description: "Generate a data-rich analytics dashboard prompt",
    descriptionZh: "生成数据丰富的分析仪表板提示词",
    template: `A sophisticated analytics dashboard with real-time data visualization and clean data hierarchy.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark, professional, data-focused
- Background: Deep Navy (#0f172a)
- Surface: Dark Slate (#1e293b) for cards
- Primary Accent: Electric Blue (#3b82f6) for charts and CTAs
- Success: Emerald (#10b981) for positive metrics
- Warning: Amber (#f59e0b) for alerts
- Text Primary: White (#ffffff)
- Text Secondary: Slate (#94a3b8)

**Page Structure:**
1. **Sidebar:** Navigation with icons and labels
2. **Header:** Page title, date range picker, user avatar
3. **KPI Row:** 4 metric cards (Revenue, Users, Conversion, Retention)
4. **Charts:** Line chart (trends) + Bar chart (comparison)
5. **Data Table:** Sortable list with pagination`,
    tags: ["dashboard", "analytics", "charts", "data"],
  },
  {
    id: "code-review",
    title: "Code Review Request",
    titleZh: "代码审查请求",
    category: "Code Generation",
    categoryZh: "代码生成",
    description: "Get thorough code review with specific feedback",
    descriptionZh: "获得具体反馈的全面代码审查",
    template: `You are a senior software engineer with expertise in [LANGUAGE/FRAMEWORK]. Review the following code for:

**Review Criteria:**
1. **Correctness:** Logic errors, edge cases, potential bugs
2. **Performance:** Inefficiencies, unnecessary computations, memory leaks
3. **Security:** Vulnerabilities, input validation, authentication issues
4. **Readability:** Naming conventions, code clarity, documentation
5. **Best Practices:** Design patterns, SOLID principles, DRY violations

**Code to Review:**
\`\`\`[language]
[PASTE YOUR CODE HERE]
\`\`\`

**Output Format:**
- Overall rating (1-10)
- Critical issues (must fix)
- Suggestions (nice to have)
- Refactored version of the most problematic section`,
    tags: ["code", "review", "debugging", "quality"],
  },
  {
    id: "content-blog",
    title: "Blog Post Writer",
    titleZh: "博客文章写作",
    category: "Content Creation",
    categoryZh: "内容创作",
    description: "Create engaging, SEO-optimized blog posts",
    descriptionZh: "创建引人入胜的SEO优化博客文章",
    template: `You are an expert content writer specializing in [INDUSTRY/NICHE]. Write a comprehensive blog post following these specifications:

**Article Details:**
- Topic: [YOUR TOPIC]
- Target Audience: [DESCRIBE YOUR READER]
- Tone: [Professional/Casual/Technical/Conversational]
- Word Count: [TARGET LENGTH]
- Primary Keyword: [SEO KEYWORD]

**Structure Requirements:**
1. **Hook:** Compelling opening that addresses reader pain point
2. **Introduction:** Context and what reader will learn
3. **Main Sections:** 3-5 H2 sections with supporting H3s
4. **Examples:** Real-world examples or case studies
5. **Conclusion:** Key takeaways and clear CTA

**SEO Requirements:**
- Include primary keyword naturally 3-5 times
- Add 2-3 related keywords
- Write a compelling meta description (155 chars)`,
    tags: ["blog", "content", "seo", "writing"],
  },
  {
    id: "data-analysis",
    title: "Data Analysis Request",
    titleZh: "数据分析请求",
    category: "Data Analysis",
    categoryZh: "数据分析",
    description: "Structured prompt for data analysis tasks",
    descriptionZh: "数据分析任务的结构化提示词",
    template: `You are a data analyst. Analyze the following dataset and provide actionable insights.

**Dataset Context:**
- Data Type: [DESCRIBE YOUR DATA]
- Time Period: [DATE RANGE]
- Business Context: [WHY THIS DATA MATTERS]

**Analysis Requirements:**
1. **Descriptive Statistics:** Mean, median, distribution, outliers
2. **Trend Analysis:** Identify patterns over time
3. **Correlation Analysis:** Relationships between variables
4. **Anomaly Detection:** Unusual data points and possible causes
5. **Actionable Insights:** Top 3 recommendations based on findings

**Output Format:**
- Executive Summary (3 sentences max)
- Key Findings (bullet points)
- Visualizations needed (describe charts)
- Recommended Actions (prioritized list)

**Data:**
[PASTE YOUR DATA OR DESCRIPTION HERE]`,
    tags: ["data", "analysis", "statistics", "insights"],
  },
  {
    id: "product-spec",
    title: "Product Feature Spec",
    titleZh: "产品功能规格",
    category: "Product Management",
    categoryZh: "产品管理",
    description: "Write detailed product feature specifications",
    descriptionZh: "编写详细的产品功能规格说明",
    template: `You are a product manager. Write a detailed feature specification for the following:

**Feature Overview:**
- Feature Name: [NAME]
- Problem Statement: [WHAT PROBLEM DOES THIS SOLVE]
- Target Users: [WHO WILL USE THIS]
- Success Metrics: [HOW WILL WE MEASURE SUCCESS]

**Specification Sections:**
1. **User Stories:** As a [user], I want [feature] so that [benefit]
2. **Acceptance Criteria:** Specific, testable conditions for completion
3. **Technical Requirements:** Backend, frontend, API needs
4. **Edge Cases:** Unusual scenarios to handle
5. **Out of Scope:** Explicitly what this feature does NOT include
6. **Dependencies:** Other features or systems required
7. **Timeline:** Rough effort estimate (S/M/L/XL)`,
    tags: ["product", "spec", "feature", "requirements"],
  },
];

// ============================================================
// UI/UX Keyword Converter
// ============================================================
export interface KeywordConversion {
  vague: string;
  enhanced: string;
  example: string;
}

export const UIUX_KEYWORD_CONVERSIONS: KeywordConversion[] = [
  { vague: "menu at the top", enhanced: "navigation bar with logo and menu items", example: "Top navigation bar with logo on left, menu items centered, CTA button on right" },
  { vague: "button", enhanced: "primary call-to-action button", example: "Primary CTA button with rounded corners (8px), hover state, loading spinner" },
  { vague: "list of items", enhanced: "card grid layout", example: "3-column responsive card grid with image, title, description, and action button" },
  { vague: "form", enhanced: "form with labeled input fields and submit button", example: "Vertical form with floating labels, validation states, and full-width submit button" },
  { vague: "picture area", enhanced: "hero section with full-width image", example: "Full-width hero with background image, overlay gradient, centered headline and CTA" },
  { vague: "sidebar", enhanced: "collapsible navigation sidebar", example: "Left sidebar with icon + label nav items, collapsible on mobile, active state highlight" },
  { vague: "popup", enhanced: "modal dialog with overlay", example: "Centered modal with semi-transparent backdrop, close button, and action buttons" },
  { vague: "loading", enhanced: "skeleton loading state", example: "Animated skeleton placeholders matching the content layout" },
  { vague: "search", enhanced: "search input with autocomplete dropdown", example: "Search bar with magnifying glass icon, real-time suggestions dropdown, clear button" },
  { vague: "profile", enhanced: "user avatar with dropdown menu", example: "Circular avatar (32px), name display, dropdown with profile/settings/logout options" },
  { vague: "notification", enhanced: "toast notification with dismiss action", example: "Top-right toast with icon, message, and auto-dismiss after 5 seconds" },
  { vague: "table", enhanced: "sortable data table with pagination", example: "Table with sticky header, sortable columns, row hover state, and pagination controls" },
  { vague: "tabs", enhanced: "tab navigation with active indicator", example: "Horizontal tabs with underline active indicator, smooth content transition" },
  { vague: "toggle", enhanced: "switch toggle with label", example: "iOS-style switch with on/off label and smooth animation" },
  { vague: "dropdown", enhanced: "select dropdown with search filter", example: "Custom select with search input, grouped options, and multi-select support" },
];

// ============================================================
// Learning Module
// ============================================================
export interface LearningLesson {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  content: string;
  contentZh: string;
  exercise: {
    prompt: string;
    promptZh: string;
    hint: string;
    hintZh: string;
    badExample: string;
    goodExample: string;
  };
}

export const LEARNING_LESSONS: LearningLesson[] = [
  {
    id: "lesson-1",
    title: "The Art of Clarity",
    titleZh: "清晰度的艺术",
    description: "Learn to eliminate ambiguity from your prompts",
    descriptionZh: "学习消除提示词中的歧义",
    content: `Clarity is the foundation of effective prompting. A clear prompt leaves no room for misinterpretation. The model should understand exactly what you want without guessing.

**Key Principles:**
- Use specific, concrete language instead of vague terms
- Define any technical terms or domain-specific concepts
- State your request directly — avoid passive voice
- One prompt, one goal — don't bundle multiple requests

**Common Clarity Killers:**
- "Make it better" → Better how? Faster? Cleaner? More features?
- "Write something about X" → What format? Length? Audience?
- "Fix the issue" → Which issue? What's the expected behavior?`,
    contentZh: `清晰度是有效提示词的基础。清晰的提示词不留下任何误解的空间。模型应该确切地理解你想要什么，而不需要猜测。

**关键原则：**
- 使用具体、明确的语言，而不是模糊的术语
- 定义任何技术术语或领域特定概念
- 直接陈述你的请求——避免被动语态
- 一个提示词，一个目标——不要捆绑多个请求

**常见的清晰度杀手：**
- "让它更好" → 更好在哪里？更快？更干净？更多功能？
- "写一些关于X的内容" → 什么格式？长度？受众？
- "修复问题" → 哪个问题？预期行为是什么？`,
    exercise: {
      prompt: "Improve this vague prompt: 'Write something about climate change'",
      promptZh: "改进这个模糊的提示词：'写一些关于气候变化的内容'",
      hint: "Think about: Who is the audience? What format? What specific aspect? What length?",
      hintZh: "思考：受众是谁？什么格式？哪个具体方面？什么长度？",
      badExample: "Write something about climate change",
      goodExample: "Write a 500-word explainer article about the economic impact of climate change for a general audience. Include 3 specific examples from the past decade and end with actionable steps individuals can take.",
    },
  },
  {
    id: "lesson-2",
    title: "Specificity: The Power of Details",
    titleZh: "特异性：细节的力量",
    description: "Master the art of adding the right level of detail",
    descriptionZh: "掌握添加适当细节水平的艺术",
    content: `Specificity transforms generic outputs into precisely what you need. The more specific you are about requirements, constraints, and expectations, the better the result.

**What to Specify:**
- **Format:** JSON, Markdown, bullet points, prose, code
- **Length:** Word count, number of items, sections
- **Style:** Formal, casual, technical, beginner-friendly
- **Constraints:** Must include X, must avoid Y, limited to Z
- **Examples:** Show what good looks like

**The Goldilocks Zone:**
Too vague → Generic, unhelpful output
Too specific → Overly constrained, misses the point
Just right → Clear requirements with room for quality`,
    contentZh: `特异性将通用输出转变为你精确需要的内容。你对需求、约束和期望越具体，结果就越好。

**需要指定的内容：**
- **格式：** JSON、Markdown、要点、散文、代码
- **长度：** 字数、项目数量、章节
- **风格：** 正式、休闲、技术性、适合初学者
- **约束：** 必须包含X，必须避免Y，限于Z
- **示例：** 展示好的样子

**恰到好处的区域：**
太模糊 → 通用、无用的输出
太具体 → 过度约束，错过重点
恰到好处 → 清晰的要求，有质量空间`,
    exercise: {
      prompt: "Add specificity to: 'Create a button component'",
      promptZh: "为以下内容添加特异性：'创建一个按钮组件'",
      hint: "Consider: What language/framework? What variants? What props? What styling?",
      hintZh: "考虑：什么语言/框架？什么变体？什么属性？什么样式？",
      badExample: "Create a button component",
      goodExample: "Create a React TypeScript button component with: variants (primary, secondary, danger), sizes (sm, md, lg), disabled state, loading state with spinner, onClick handler prop, and Tailwind CSS styling. Include JSDoc comments.",
    },
  },
  {
    id: "lesson-3",
    title: "Structure: Organizing Your Thoughts",
    titleZh: "结构：组织你的思维",
    description: "Learn to structure prompts for complex, multi-part tasks",
    descriptionZh: "学习为复杂的多部分任务构建提示词",
    content: `Well-structured prompts lead to well-structured outputs. When your prompt has clear organization, the model can follow your logic and produce organized, comprehensive responses.

**Structure Techniques:**
1. **Role → Context → Task → Format** — The classic framework
2. **Numbered Steps** — For sequential processes
3. **Sections with Headers** — For complex multi-part requests
4. **If-Then Logic** — For conditional requirements

**The RCTF Framework:**
- **R**ole: "You are a [expert]..."
- **C**ontext: "The situation is [background]..."
- **T**ask: "Your task is to [specific action]..."
- **F**ormat: "Return your response as [format]..."`,
    contentZh: `结构良好的提示词会产生结构良好的输出。当你的提示词有清晰的组织时，模型可以遵循你的逻辑并产生有组织、全面的回答。

**结构技巧：**
1. **角色 → 上下文 → 任务 → 格式** — 经典框架
2. **编号步骤** — 用于顺序过程
3. **带标题的章节** — 用于复杂的多部分请求
4. **If-Then逻辑** — 用于条件要求

**RCTF框架：**
- **R**ole（角色）："你是一位[专家]..."
- **C**ontext（上下文）："情况是[背景]..."
- **T**ask（任务）："你的任务是[具体行动]..."
- **F**ormat（格式）："以[格式]返回你的回答..."`,
    exercise: {
      prompt: "Structure this unorganized prompt: 'I need help with my website. It's slow and users complain. Fix it and also make it look better and add dark mode and improve the mobile version.'",
      promptZh: "构建这个无组织的提示词：'我需要帮助处理我的网站。它很慢，用户抱怨。修复它，同时让它看起来更好，添加暗模式，改善移动版本。'",
      hint: "Break it into separate concerns: performance, design, features. Use numbered priorities.",
      hintZh: "将其分解为独立的关注点：性能、设计、功能。使用编号优先级。",
      badExample: "I need help with my website. It's slow and users complain. Fix it and also make it look better and add dark mode and improve the mobile version.",
      goodExample: `You are a senior web developer. Analyze and improve my website with these priorities:

**Priority 1 - Performance (Critical):**
- Identify and fix the top 3 causes of slow loading
- Target: < 2 second load time on 4G

**Priority 2 - Mobile Experience:**
- Audit and fix responsive design issues
- Ensure touch targets are ≥ 44px

**Priority 3 - Visual Improvements:**
- Suggest 3 specific UI improvements
- Implement dark mode using CSS variables

For each priority, provide: diagnosis, solution, and implementation steps.`,
    },
  },
  {
    id: "lesson-4",
    title: "The Power of Examples",
    titleZh: "示例的力量",
    description: "Use few-shot learning to dramatically improve output quality",
    descriptionZh: "使用少样本学习显著提高输出质量",
    content: `Examples are the most powerful tool in prompt engineering. Showing the model what you want is almost always more effective than describing it.

**Types of Examples:**
- **Input-Output pairs:** Show the transformation you want
- **Good examples:** Demonstrate the quality standard
- **Bad examples:** Show what to avoid
- **Edge cases:** Handle tricky scenarios

**How Many Examples?**
- 1 example: Establishes the pattern
- 2-3 examples: Confirms the pattern
- 4+ examples: For complex or nuanced patterns

**The Golden Rule:**
If you can't think of a good example, your requirements aren't clear enough yet.`,
    contentZh: `示例是提示词工程中最强大的工具。向模型展示你想要什么几乎总是比描述它更有效。

**示例类型：**
- **输入-输出对：** 展示你想要的转换
- **好示例：** 展示质量标准
- **坏示例：** 展示要避免的内容
- **边缘情况：** 处理棘手的场景

**需要多少示例？**
- 1个示例：建立模式
- 2-3个示例：确认模式
- 4+个示例：用于复杂或细微的模式

**黄金法则：**
如果你想不出好的示例，说明你的要求还不够清晰。`,
    exercise: {
      prompt: "Add examples to improve: 'Convert these product names to URL slugs'",
      promptZh: "添加示例以改进：'将这些产品名称转换为URL别名'",
      hint: "Show 2-3 input-output pairs to demonstrate the exact format you want",
      hintZh: "展示2-3个输入-输出对以演示你想要的确切格式",
      badExample: "Convert these product names to URL slugs",
      goodExample: `Convert product names to URL slugs following these examples:

Input: "Blue Widget Pro 2.0" → Output: "blue-widget-pro-2-0"
Input: "The Amazing Coffee Maker!" → Output: "the-amazing-coffee-maker"
Input: "USB-C Hub (7-in-1)" → Output: "usb-c-hub-7-in-1"

Rules: lowercase, hyphens for spaces, remove special chars except hyphens, keep numbers.

Now convert: [YOUR PRODUCT NAMES]`,
    },
  },
];
