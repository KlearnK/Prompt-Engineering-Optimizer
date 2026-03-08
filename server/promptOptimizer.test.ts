import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TECHNIQUES, QUALITY_DIMENSIONS } from "../shared/promptData";
import { PROVIDER_CONFIGS, type ModelProvider } from "../shared/modelProviders";
import { getModelConfigFromRequest } from "./multiLLM";
import type { Request } from "express";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock the db module
vi.mock("./db", () => ({
  savePromptHistory: vi.fn().mockResolvedValue(undefined),
  getUserPromptHistory: vi.fn().mockResolvedValue([]),
  getPromptHistoryById: vi.fn().mockResolvedValue(null),
  updatePromptHistory: vi.fn().mockResolvedValue(undefined),
  deletePromptHistory: vi.fn().mockResolvedValue(undefined),
}));

import { invokeLLM } from "./_core/llm";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const mockAssessmentResult = {
  dimensions: [
    { dimension: "clarity", rating: "Good", score: 3, strengths: ["Clear intent"], weaknesses: [], suggestions: ["Add more context"] },
    { dimension: "specificity", rating: "Fair", score: 2, strengths: [], weaknesses: ["Too vague"], suggestions: ["Specify target audience"] },
    { dimension: "structure", rating: "Good", score: 3, strengths: ["Logical flow"], weaknesses: [], suggestions: [] },
    { dimension: "completeness", rating: "Fair", score: 2, strengths: [], weaknesses: ["Missing constraints"], suggestions: ["Add output format"] },
    { dimension: "tone", rating: "Good", score: 3, strengths: ["Professional tone"], weaknesses: [], suggestions: [] },
    { dimension: "constraints", rating: "Poor", score: 1, strengths: [], weaknesses: ["No constraints defined"], suggestions: ["Add length limit"] },
  ],
  overallScore: 2.3,
  overallRating: "Fair",
  summary: "The prompt has good clarity but lacks specificity and constraints.",
  topWeaknesses: ["Missing constraints", "Too vague"],
  recommendedTechniques: [1, 5, 12],
};

// ─── Prompt assessment tests ──────────────────────────────────────────────────

describe("prompt.assess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns assessment result from LLM", async () => {
    const mockInvokeLLM = vi.mocked(invokeLLM);
    mockInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockAssessmentResult) } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.assess({ prompt: "Write a blog post about AI" });

    expect(result).toMatchObject({
      overallScore: expect.any(Number),
      overallRating: expect.any(String),
      dimensions: expect.arrayContaining([
        expect.objectContaining({ dimension: expect.any(String), rating: expect.any(String) }),
      ]),
    });
    expect(mockInvokeLLM).toHaveBeenCalledOnce();
  });

  it("throws error when prompt is empty", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.prompt.assess({ prompt: "" })).rejects.toThrow();
  });

  it("throws error when LLM returns no content", async () => {
    const mockInvokeLLM = vi.mocked(invokeLLM);
    mockInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: null } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.prompt.assess({ prompt: "Test prompt" })).rejects.toThrow("No response from LLM");
  });
});

describe("prompt.optimize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns optimized prompt from LLM", async () => {
    const mockInvokeLLM = vi.mocked(invokeLLM);
    mockInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: "You are an expert content writer. Write a comprehensive blog post about artificial intelligence..." } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.prompt.optimize({
      prompt: "Write a blog post about AI",
      assessmentSummary: "The prompt lacks specificity and constraints.",
      recommendedTechniqueIds: [1, 5, 12],
    });

    expect(result).toMatchObject({
      optimizedPrompt: expect.any(String),
    });
    expect(result.optimizedPrompt.length).toBeGreaterThan(0);
  });
});

// ─── History routes tests ─────────────────────────────────────────────────────

describe("history routes", () => {
  it("list requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.history.list()).rejects.toThrow();
  });

  it("save requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.history.save({
      originalPrompt: "Test prompt",
    })).rejects.toThrow();
  });

  it("authenticated user can save history", async () => {
    const { savePromptHistory } = await import("./db");
    const mockSave = vi.mocked(savePromptHistory);
    mockSave.mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.save({
      originalPrompt: "Test prompt",
      optimizedPrompt: "Improved test prompt",
    });

    expect(result).toEqual({ success: true });
    expect(mockSave).toHaveBeenCalledOnce();
  });

  it("authenticated user can list history", async () => {
    const { getUserPromptHistory } = await import("./db");
    const mockList = vi.mocked(getUserPromptHistory);
    mockList.mockResolvedValue([]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Shared data integrity tests ──────────────────────────────────────────────

describe("TECHNIQUES library", () => {
  it("should have exactly 58 techniques", () => {
    expect(TECHNIQUES).toHaveLength(58);
  });

  it("technique IDs should be unique and sequential from 1 to 58", () => {
    const ids = TECHNIQUES.map(t => t.id).sort((a, b) => a - b);
    for (let i = 0; i < ids.length; i++) {
      expect(ids[i]).toBe(i + 1);
    }
  });
});

describe("QUALITY_DIMENSIONS", () => {
  it("should have exactly 6 dimensions", () => {
    expect(QUALITY_DIMENSIONS).toHaveLength(6);
  });

  it("should include all required dimension IDs", () => {
    const ids = QUALITY_DIMENSIONS.map(d => d.id);
    expect(ids).toContain("clarity");
    expect(ids).toContain("specificity");
    expect(ids).toContain("structure");
    expect(ids).toContain("completeness");
    expect(ids).toContain("tone");
    expect(ids).toContain("constraints");
  });
});

// ─── Multi-model provider tests ───────────────────────────────────────────────

describe("PROVIDER_CONFIGS", () => {
  it("should have all 4 providers", () => {
    const providers: ModelProvider[] = ["deepseek", "qwen", "zhipu", "openai"];
    for (const p of providers) {
      expect(PROVIDER_CONFIGS[p]).toBeDefined();
    }
  });

  it("CN-friendly providers should be marked correctly", () => {
    expect(PROVIDER_CONFIGS.deepseek.cnFriendly).toBe(true);
    expect(PROVIDER_CONFIGS.qwen.cnFriendly).toBe(true);
    expect(PROVIDER_CONFIGS.zhipu.cnFriendly).toBe(true);
    expect(PROVIDER_CONFIGS.openai.cnFriendly).toBe(false);
  });

  it("each provider should have at least one recommended model", () => {
    for (const config of Object.values(PROVIDER_CONFIGS)) {
      const hasRecommended = config.models.some(m => m.recommended);
      expect(hasRecommended).toBe(true);
    }
  });
});

describe("getModelConfigFromRequest", () => {
  it("should return null when headers are missing", () => {
    const req = { headers: {} } as Request;
    expect(getModelConfigFromRequest(req)).toBeNull();
  });

  it("should return null when provider is unknown", () => {
    const req = {
      headers: {
        "x-model-provider": "unknown-provider",
        "x-model-id": "some-model",
        "x-api-key": "sk-test",
      },
    } as unknown as Request;
    expect(getModelConfigFromRequest(req)).toBeNull();
  });

  it("should return config when all valid headers are present", () => {
    const req = {
      headers: {
        "x-model-provider": "deepseek",
        "x-model-id": "deepseek-chat",
        "x-api-key": "sk-testkey123",
      },
    } as unknown as Request;
    const config = getModelConfigFromRequest(req);
    expect(config).not.toBeNull();
    expect(config?.provider).toBe("deepseek");
    expect(config?.modelId).toBe("deepseek-chat");
    expect(config?.apiKey).toBe("sk-testkey123");
  });
});
