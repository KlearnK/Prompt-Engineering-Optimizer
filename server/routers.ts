import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeMultiLLM, getModelConfigFromRequest, type LLMOptions } from "./multiLLM";
import {
  savePromptHistory,
  getUserPromptHistory,
  getPromptHistoryById,
  updatePromptHistory,
  deletePromptHistory,
  recordBehaviorEvent,
  getUserDimensionWeights,
  updateDimensionWeight,
  recordTechniqueInteraction,
  toggleTechniqueFavorite,
  getUserTechniqueStats,
  getUserKnowledgeBase,
  addKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  getLearningDashboard,
} from "./db";
import { TECHNIQUES } from "../shared/promptData";

// 评估 Prompt - 跟随 UI 语言
function buildAssessmentSystemPrompt(uiLang: string): string {
  const isZh = uiLang === 'zh';
  
  if (isZh) {
    return `你是一位专业的提示词工程专家。请从6个质量维度评估给定的提示词，并以结构化JSON格式返回评估结果。所有文本内容必须使用中文。

6个评估维度：
1. clarity（清晰度）- 提示词是否清晰无歧义，容易理解？
2. specificity（特异性）- 需求和约束是否明确具体？
3. structure（结构性）- 是否有合理的逻辑组织结构？
4. completeness（完整性）- 是否包含所有必要的上下文和指令？
5. tone（语气）- 语气是否适合任务需求？
6. constraints（约束性）- 边界和限制条件是否清晰？

每个维度请提供：
- rating: "Poor" | "Fair" | "Good" | "Excellent"（保持英文，用于前端颜色映射）
- score: 1（Poor）, 2（Fair）, 3（Good）, 4（Excellent）
- strengths: 1-2条具体优点（中文，Poor时可为空数组）
- weaknesses: 1-2条具体不足（中文，Excellent时可为空数组）
- suggestions: 1-2条具体改进建议（中文）

还需提供：
- overallScore: 所有维度分数的平均值（保留1位小数）
- overallRating: 基于overallScore的综合评级（"Poor" | "Fair" | "Good" | "Excellent"）
- summary: 2-3句话的综合评估（中文）
- topWeaknesses: 2-3个最关键的问题（中文）
- recommendedTechniques: 最有帮助的技巧ID数组（数字1-58）

只返回符合上述schema的有效JSON，不要包含markdown代码块或任何解释文字。`;
  }
  
  // English version
  return `You are a professional prompt engineering expert. Please evaluate the given prompt across 6 quality dimensions and return the assessment results in structured JSON format. All text content must be in English.

6 Evaluation Dimensions:
1. clarity - Is the prompt clear and unambiguous, easy to understand?
2. specificity - Are requirements and constraints specific and concrete?
3. structure - Is there a logical and organized structure?
4. completeness - Does it include all necessary context and instructions?
5. tone - Is the tone appropriate for the task?
6. constraints - Are boundaries and limitations clear?

For each dimension, provide:
- rating: "Poor" | "Fair" | "Good" | "Excellent" (keep in English for frontend color mapping)
- score: 1 (Poor), 2 (Fair), 3 (Good), 4 (Excellent)
- strengths: 1-2 specific strengths (in English, empty array for Poor)
- weaknesses: 1-2 specific weaknesses (in English, empty array for Excellent)
- suggestions: 1-2 concrete improvement suggestions (in English)

Also provide:
- overallScore: Average of all dimension scores (1 decimal place)
- overallRating: Comprehensive rating based on overallScore ("Poor" | "Fair" | "Good" | "Excellent")
- summary: 2-3 sentences of comprehensive assessment (in English)
- topWeaknesses: 2-3 most critical issues (in English)
- recommendedTechniques: Array of most helpful technique IDs (numbers 1-58)

Return only valid JSON conforming to the above schema, without markdown code blocks or any explanatory text.`;
}

// 优化 Prompt - 跟随用户输入语言，不指定输出语言
function buildOptimizationSystemPrompt(assessmentSummary: string, techniques: string[]): string {
  return `You are a professional prompt engineering expert. Please rewrite and optimize the given prompt based on the assessment results.

Assessment Summary: ${assessmentSummary}

Apply the following optimization techniques: ${techniques.join(", ")}

Optimization Rules:
1. Preserve the original intent and goal of the prompt
2. Improve clarity by eliminating ambiguity and vague language
3. Add specific details, constraints, and examples where helpful to enhance specificity
4. Organize the prompt structure logically (include role, context, task, format where applicable)
5. Ensure completeness by supplementing missing context
6. Use tone appropriate for the task
7. Add clear constraints and boundaries
8. For UI/UX prompts, use specific component terminology and include design system specification blocks
9. For code prompts, specify language, framework, and output format
10. Keep the optimized prompt concise but complete
11. CRITICAL: The optimized prompt MUST be in the SAME LANGUAGE as the original user input prompt. If user wrote in Chinese, output Chinese. If user wrote in English, output English. Maintain the original language throughout.

Return only the optimized prompt text, without any explanations, markdown code blocks, or prefixes.`;
}

// UI关键词转换 Prompt - 跟随 UI 语言
function buildUiKeywordsPrompt(uiLang: string): string {
  const isZh = uiLang === 'zh';
  
  if (isZh) {
    return `你是一位专业的UI/UX提示词专家。分析给定的UI设计提示词，识别应该用专业UI/UX术语替换的模糊描述词。返回JSON格式的转换建议，所有reason字段使用中文。`;
  }
  
  return `You are a professional UI/UX prompt expert. Analyze the given UI design prompt and identify vague descriptions that should be replaced with professional UI/UX terminology. Return conversion suggestions in JSON format, with all reason fields in English.`;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  prompt: router({
    assess: publicProcedure
      .input(z.object({ 
        prompt: z.string().min(1).max(10000),
        config: z.object({
          provider: z.enum(['deepseek', 'openai', 'qwen', 'zhipu']),
          apiKey: z.string(),
          model: z.string(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 从请求头读取 UI 语言
        const uiLang = (ctx.req.headers['x-ui-language'] as string) || 'zh';
        
        // 从 input 读取配置
        let modelConfig = input.config ? {
          provider: input.config.provider,
          modelId: input.config.model,
          apiKey: input.config.apiKey,
        } : null;
        
        // 如果 input 没有，尝试从请求头读取（兼容旧方式）
        if (!modelConfig) {
          modelConfig = getModelConfigFromRequest(ctx.req);
        }
        
        if (!modelConfig) {
          throw new Error(uiLang === 'zh' ? "请先配置 AI 模型 API Key" : "Please configure AI model API Key first");
        }

        const options: LLMOptions = {
          messages: [
            { role: "system", content: buildAssessmentSystemPrompt(uiLang) },
            { role: "user", content: `Evaluate this prompt:\n\n${input.prompt}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "assessment_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dimension: { type: "string" },
                        rating: { type: "string" },
                        score: { type: "number" },
                        strengths: { type: "array", items: { type: "string" } },
                        weaknesses: { type: "array", items: { type: "string" } },
                        suggestions: { type: "array", items: { type: "string" } },
                      },
                      required: ["dimension", "rating", "score", "strengths", "weaknesses", "suggestions"],
                      additionalProperties: false,
                    },
                  },
                  overallScore: { type: "number" },
                  overallRating: { type: "string" },
                  summary: { type: "string" },
                  topWeaknesses: { type: "array", items: { type: "string" } },
                  recommendedTechniques: { type: "array", items: { type: "number" } },
                },
                required: ["dimensions", "overallScore", "overallRating", "summary", "topWeaknesses", "recommendedTechniques"],
                additionalProperties: false,
              },
            },
          },
        };

        const response = await invokeMultiLLM(options, modelConfig);
        const content = response.choices[0]?.message?.content ?? "";
        if (!content) throw new Error(uiLang === 'zh' ? "模型无响应" : "No response from LLM");

        try {
          const result = JSON.parse(content);
          return result;
        } catch (e) {
          console.error("JSON parse error:", e);
          console.error("Raw content:", content.substring(0, 500));
          throw new Error(uiLang === 'zh' ? "模型返回格式错误" : "Invalid response format from LLM");
        }
      }),

    optimize: publicProcedure
      .input(z.object({
        prompt: z.string().min(1).max(10000),
        assessmentSummary: z.string(),
        recommendedTechniqueIds: z.array(z.number()),
        config: z.object({
          provider: z.enum(['deepseek', 'openai', 'qwen', 'zhipu']),
          apiKey: z.string(),
          model: z.string(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 从请求头读取 UI 语言（用于错误提示）
        const uiLang = (ctx.req.headers['x-ui-language'] as string) || 'zh';
        
        // 从 input 读取配置
        let modelConfig = input.config ? {
          provider: input.config.provider,
          modelId: input.config.model,
          apiKey: input.config.apiKey,
        } : null;
        
        // 如果 input 没有，尝试从请求头读取（兼容旧方式）
        if (!modelConfig) {
          modelConfig = getModelConfigFromRequest(ctx.req);
        }
        
        if (!modelConfig) {
          throw new Error(uiLang === 'zh' ? "请先配置 AI 模型 API Key" : "Please configure AI model API Key first");
        }

        const techniques = input.recommendedTechniqueIds
          .slice(0, 5)
          .map(id => TECHNIQUES.find(t => t.id === id)?.name)
          .filter(Boolean) as string[];

        const options: LLMOptions = {
          messages: [
            { role: "system", content: buildOptimizationSystemPrompt(input.assessmentSummary, techniques) },
            { role: "user", content: `Original prompt to optimize:\n\n${input.prompt}` },
          ],
        };

        const response = await invokeMultiLLM(options, modelConfig);
        const content = response.choices[0]?.message?.content ?? "";
        if (!content) throw new Error(uiLang === 'zh' ? "模型无响应" : "No response from LLM");
        
        return { optimizedPrompt: content.trim() };
      }),

    convertUiKeywords: publicProcedure
      .input(z.object({ 
        prompt: z.string().min(1).max(5000),
        config: z.object({
          provider: z.enum(['deepseek', 'openai', 'qwen', 'zhipu']),
          apiKey: z.string(),
          model: z.string(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 从请求头读取 UI 语言
        const uiLang = (ctx.req.headers['x-ui-language'] as string) || 'zh';
        
        // 从 input 读取配置
        let modelConfig = input.config ? {
          provider: input.config.provider,
          modelId: input.config.model,
          apiKey: input.config.apiKey,
        } : null;
        
        // 如果 input 没有，尝试从请求头读取（兼容旧方式）
        if (!modelConfig) {
          modelConfig = getModelConfigFromRequest(ctx.req);
        }
        
        if (!modelConfig) {
          throw new Error(uiLang === 'zh' ? "请先配置 AI 模型 API Key" : "Please configure AI model API Key first");
        }

        const userMessage = uiLang === 'zh' 
          ? `分析以下UI提示词，建议具体的术语替换方案：\n\n${input.prompt}\n\n返回JSON格式：{ "conversions": [{ "original": "提示词中找到的模糊词", "suggested": "具体的UI专业术语", "reason": "为什么这样更好（中文说明）" }], "enhancedPrompt": "应用所有替换后的完整重写提示词" }`
          : `Analyze the following UI prompt and suggest specific terminology replacements:\n\n${input.prompt}\n\nReturn JSON format: { "conversions": [{ "original": "vague word found in prompt", "suggested": "specific UI professional term", "reason": "why this is better (in English)" }], "enhancedPrompt": "complete rewritten prompt with all replacements applied" }`;

        const options: LLMOptions = {
          messages: [
            {
              role: "system",
              content: buildUiKeywordsPrompt(uiLang),
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "keyword_conversion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  conversions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original: { type: "string" },
                        suggested: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["original", "suggested", "reason"],
                      additionalProperties: false,
                    },
                  },
                  enhancedPrompt: { type: "string" },
                },
                required: ["conversions", "enhancedPrompt"],
                additionalProperties: false,
              },
            },
          },
        };

        const response = await invokeMultiLLM(options, modelConfig);
        const content = response.choices[0]?.message?.content ?? "";

        try {
          const result = JSON.parse(content);
          return result;
        } catch {
          return { conversions: [], enhancedPrompt: content };
        }
      }),
  }),

  history: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserPromptHistory(ctx.user.id);
      }),

    save: protectedProcedure
      .input(z.object({
        title: z.string().max(255).optional(),
        originalPrompt: z.string().min(1).max(10000),
        optimizedPrompt: z.string().max(10000).optional(),
        assessmentResult: z.any().optional(),
        appliedTechniques: z.array(z.number()).optional(),
        category: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await savePromptHistory({
          userId: ctx.user.id,
          title: input.title ?? input.originalPrompt.slice(0, 60) + "...",
          originalPrompt: input.originalPrompt,
          optimizedPrompt: input.optimizedPrompt ?? null,
          assessmentResult: input.assessmentResult ?? null,
          appliedTechniques: input.appliedTechniques ?? null,
          category: input.category ?? null,
        });
        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getPromptHistoryById(input.id, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().max(255).optional(),
        originalPrompt: z.string().max(10000).optional(),
        optimizedPrompt: z.string().max(10000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updatePromptHistory(id, ctx.user.id, data);
        return { success: true };
      }),

     delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deletePromptHistory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  learning: router({
    dashboard: protectedProcedure
      .query(async ({ ctx }) => {
        return getLearningDashboard(ctx.user.id);
      }),

    recordEvent: protectedProcedure
      .input(z.object({
        eventType: z.enum([
          'technique_adopted', 'technique_rejected',
          'optimization_accepted', 'optimization_rejected',
          'dimension_feedback', 'template_used', 'prompt_saved',
        ]),
        payload: z.record(z.string(), z.unknown()).optional(),
        scoreDelta: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await recordBehaviorEvent({
          userId: ctx.user.id,
          eventType: input.eventType,
          payload: input.payload ?? null,
          scoreDelta: input.scoreDelta ?? null,
        });
        if (input.eventType === 'dimension_feedback' && input.payload) {
          const { dimensionId, delta } = input.payload as { dimensionId?: string; delta?: number };
          if (dimensionId && typeof delta === 'number') {
            await updateDimensionWeight(ctx.user.id, dimensionId, delta);
          }
        }
        if (input.eventType === 'technique_adopted' && input.payload) {
          const { techniqueId } = input.payload as { techniqueId?: string };
          if (techniqueId) {
            await recordTechniqueInteraction(ctx.user.id, techniqueId, 'adopted', input.scoreDelta);
          }
        }
        if (input.eventType === 'technique_rejected' && input.payload) {
          const { techniqueId } = input.payload as { techniqueId?: string };
          if (techniqueId) {
            await recordTechniqueInteraction(ctx.user.id, techniqueId, 'rejected');
          }
        }
        return { success: true };
      }),

    getDimensionWeights: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserDimensionWeights(ctx.user.id);
      }),

    getTechniqueStats: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserTechniqueStats(ctx.user.id);
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({ techniqueId: z.string(), isFavorited: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await toggleTechniqueFavorite(ctx.user.id, input.techniqueId, input.isFavorited);
        return { success: true };
      }),

    knowledge: router({
      list: protectedProcedure
        .query(async ({ ctx }) => {
          return getUserKnowledgeBase(ctx.user.id);
        }),

      add: protectedProcedure
        .input(z.object({
          title: z.string().min(1).max(255),
          content: z.string().min(1).max(5000),
          entryType: z.enum(['custom_rule', 'personal_note', 'learned_pattern']).default('custom_rule'),
          category: z.string().max(64).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          await addKnowledgeEntry({
            userId: ctx.user.id,
            title: input.title,
            content: input.content,
            entryType: input.entryType,
            category: input.category ?? null,
          });
          return { success: true };
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().max(255).optional(),
          content: z.string().max(5000).optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { id, ...data } = input;
          await updateKnowledgeEntry(id, ctx.user.id, data);
          return { success: true };
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          await deleteKnowledgeEntry(input.id, ctx.user.id);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;