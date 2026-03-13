import { getDB } from '../db/sqlite';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  mode: 'evaluate' | 'iterate';
  input: string;
  output?: string;
  iterations?: any[];
  modelUsed?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export async function createSession(data: SessionData): Promise<string> {
  const db = getDB();
  const id = uuidv4();
  
  await db.run(
    `INSERT INTO sessions (id, timestamp, mode, input, output, iterations, model_used, duration_ms, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      Date.now(),
      data.mode,
      data.input,
      data.output || null,
      data.iterations ? JSON.stringify(data.iterations) : null,
      data.modelUsed || null,
      data.durationMs || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]
  );
  
  return id;
}

export async function updateSession(id: string, updates: Partial<SessionData>) {
  const db = getDB();
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.output !== undefined) {
    fields.push('output = ?');
    values.push(updates.output);
  }
  if (updates.iterations !== undefined) {
    fields.push('iterations = ?');
    values.push(JSON.stringify(updates.iterations));
  }
  if (updates.modelUsed !== undefined) {
    fields.push('model_used = ?');
    values.push(updates.modelUsed);
  }
  
  values.push(id);
  
  await db.run(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function addFeedback(sessionId: string, rating: number, comment?: string) {
  const db = getDB();
  await db.run(
    'UPDATE sessions SET feedback_rating = ?, feedback_comment = ? WHERE id = ?',
    [rating, comment || null, sessionId]
  );
}

export async function getRecentSessions(limit: number = 20) {
  const db = getDB();
  return db.all(
    'SELECT * FROM sessions ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
}
