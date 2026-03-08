import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, promptHistory, InsertPromptHistory,
  userBehaviorEvents, InsertUserBehaviorEvent,
  userDimensionWeights,
  userTechniqueStats,
  userKnowledgeBase, InsertUserKnowledgeBase,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Prompt history helpers ───────────────────────────────────────────────────

export async function savePromptHistory(data: InsertPromptHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(promptHistory).values(data);
  return result;
}

export async function getUserPromptHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promptHistory)
    .where(eq(promptHistory.userId, userId))
    .orderBy(desc(promptHistory.createdAt))
    .limit(limit);
}

export async function getPromptHistoryById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promptHistory).where(eq(promptHistory.id, id)).limit(1);
  if (!result[0] || result[0].userId !== userId) return undefined;
  return result[0];
}

export async function updatePromptHistory(id: number, userId: number, data: Partial<InsertPromptHistory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(promptHistory).set({ ...data, updatedAt: new Date() }).where(eq(promptHistory.id, id));
}

export async function deletePromptHistory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getPromptHistoryById(id, userId);
  if (!existing) throw new Error("Not found or unauthorized");
  await db.delete(promptHistory).where(eq(promptHistory.id, id));
}

// ─── Continuous Learning: Behavior Events ────────────────────────────────────

export async function recordBehaviorEvent(data: InsertUserBehaviorEvent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userBehaviorEvents).values(data);
}

export async function getUserBehaviorStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalEvents: 0, techniqueAdoptions: 0, optimizationsAccepted: 0, avgScoreDelta: 0 };
  const events = await db.select().from(userBehaviorEvents)
    .where(eq(userBehaviorEvents.userId, userId));
  const techniqueAdoptions = events.filter(e => e.eventType === 'technique_adopted').length;
  const optimizationsAccepted = events.filter(e => e.eventType === 'optimization_accepted').length;
  const deltas = events.filter(e => e.scoreDelta !== null).map(e => e.scoreDelta as number);
  const avgScoreDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  return { totalEvents: events.length, techniqueAdoptions, optimizationsAccepted, avgScoreDelta };
}

// ─── Continuous Learning: Dimension Weights ──────────────────────────────────

const DEFAULT_DIMENSIONS = ['clarity', 'specificity', 'structure', 'completeness', 'tone', 'constraints'];

export async function getUserDimensionWeights(userId: number): Promise<Record<string, number>> {
  const db = await getDb();
  const defaults = Object.fromEntries(DEFAULT_DIMENSIONS.map(d => [d, 1.0]));
  if (!db) return defaults;
  const rows = await db.select().from(userDimensionWeights).where(eq(userDimensionWeights.userId, userId));
  const result = { ...defaults };
  for (const row of rows) result[row.dimensionId] = row.weight;
  return result;
}

export async function updateDimensionWeight(userId: number, dimensionId: string, delta: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userDimensionWeights)
    .where(and(eq(userDimensionWeights.userId, userId), eq(userDimensionWeights.dimensionId, dimensionId)))
    .limit(1);
  if (existing.length > 0) {
    const current = existing[0];
    // Clamp weight between 0.3 and 2.0, use exponential moving average
    const newWeight = Math.max(0.3, Math.min(2.0, current.weight + delta * 0.1));
    await db.update(userDimensionWeights)
      .set({ weight: newWeight, sampleCount: current.sampleCount + 1 })
      .where(eq(userDimensionWeights.id, current.id));
  } else {
    const initWeight = Math.max(0.3, Math.min(2.0, 1.0 + delta * 0.1));
    await db.insert(userDimensionWeights).values({ userId, dimensionId, weight: initWeight, sampleCount: 1 });
  }
}

// ─── Continuous Learning: Technique Stats ────────────────────────────────────

export async function getUserTechniqueStats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userTechniqueStats).where(eq(userTechniqueStats.userId, userId));
}

export async function recordTechniqueInteraction(
  userId: number,
  techniqueId: string,
  action: 'recommended' | 'adopted' | 'rejected',
  scoreDelta?: number
) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userTechniqueStats)
    .where(and(eq(userTechniqueStats.userId, userId), eq(userTechniqueStats.techniqueId, techniqueId)))
    .limit(1);
  if (existing.length > 0) {
    const row = existing[0];
    const updates: Record<string, unknown> = {};
    if (action === 'recommended') updates.timesRecommended = row.timesRecommended + 1;
    if (action === 'adopted') {
      updates.timesAdopted = row.timesAdopted + 1;
      if (scoreDelta !== undefined) {
        const totalAdopted = row.timesAdopted + 1;
        updates.avgScoreDelta = (row.avgScoreDelta * row.timesAdopted + scoreDelta) / totalAdopted;
      }
    }
    if (action === 'rejected') updates.timesRejected = row.timesRejected + 1;
    await db.update(userTechniqueStats).set(updates).where(eq(userTechniqueStats.id, row.id));
  } else {
    await db.insert(userTechniqueStats).values({
      userId, techniqueId,
      timesRecommended: action === 'recommended' ? 1 : 0,
      timesAdopted: action === 'adopted' ? 1 : 0,
      timesRejected: action === 'rejected' ? 1 : 0,
      avgScoreDelta: scoreDelta ?? 0,
    });
  }
}

export async function toggleTechniqueFavorite(userId: number, techniqueId: string, isFavorited: boolean) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(userTechniqueStats)
    .where(and(eq(userTechniqueStats.userId, userId), eq(userTechniqueStats.techniqueId, techniqueId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(userTechniqueStats).set({ isFavorited }).where(eq(userTechniqueStats.id, existing[0].id));
  } else {
    await db.insert(userTechniqueStats).values({ userId, techniqueId, isFavorited });
  }
}

// ─── Continuous Learning: Personal Knowledge Base ────────────────────────────

export async function getUserKnowledgeBase(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userKnowledgeBase)
    .where(and(eq(userKnowledgeBase.userId, userId), eq(userKnowledgeBase.isActive, true)))
    .orderBy(desc(userKnowledgeBase.createdAt));
}

export async function addKnowledgeEntry(data: InsertUserKnowledgeBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(userKnowledgeBase).values(data);
  return result;
}

export async function updateKnowledgeEntry(id: number, userId: number, data: Partial<InsertUserKnowledgeBase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userKnowledgeBase)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userKnowledgeBase.id, id), eq(userKnowledgeBase.userId, userId)));
}

export async function deleteKnowledgeEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userKnowledgeBase)
    .set({ isActive: false })
    .where(and(eq(userKnowledgeBase.id, id), eq(userKnowledgeBase.userId, userId)));
}

// ─── Learning Summary (for dashboard) ────────────────────────────────────────

export async function getLearningDashboard(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [behaviorStats, dimensionWeights, techniqueStats, knowledgeEntries, recentHistory] = await Promise.all([
    getUserBehaviorStats(userId),
    getUserDimensionWeights(userId),
    getUserTechniqueStats(userId),
    getUserKnowledgeBase(userId),
    getUserPromptHistory(userId, 20),
  ]);

  // Compute score progression from history
  const scoresOverTime = recentHistory
    .filter(h => h.assessmentResult)
    .map(h => {
      const assessment = h.assessmentResult as { overallScore?: number } | null;
      return {
        date: h.createdAt,
        score: assessment?.overallScore ?? 0,
        title: h.title ?? '未命名',
      };
    })
    .reverse();

  // Top adopted techniques
  const topTechniques = techniqueStats
    .filter(t => t.timesAdopted > 0)
    .sort((a, b) => b.timesAdopted - a.timesAdopted)
    .slice(0, 5);

  // Favorite techniques
  const favoriteTechniques = techniqueStats.filter(t => t.isFavorited).map(t => t.techniqueId);

  return {
    behaviorStats,
    dimensionWeights,
    topTechniques,
    favoriteTechniques,
    knowledgeEntries,
    scoresOverTime,
    totalPrompts: recentHistory.length,
  };
}
