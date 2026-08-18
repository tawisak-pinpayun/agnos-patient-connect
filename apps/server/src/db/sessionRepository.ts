import {
  EMPTY_PATIENT_DATA,
  type PatientData,
  type PatientDataPatch,
} from '@apc/shared';
import { sessionsCollection, submissionsCollection } from './mongo';
import type { SessionDoc } from './types';

function newSessionDoc(sessionId: string): SessionDoc {
  const now = new Date();
  return {
    _id: sessionId,
    data: { ...EMPTY_PATIENT_DATA },
    status: 'filling',
    createdAt: now,
    lastActivityAt: now,
    submittedAt: null,
  };
}

export async function findSession(sessionId: string): Promise<SessionDoc | null> {
  return sessionsCollection().findOne({ _id: sessionId });
}

export async function ensureSession(sessionId: string): Promise<SessionDoc> {
  const existing = await findSession(sessionId);
  if (existing) return existing;

  const doc = newSessionDoc(sessionId);
  await sessionsCollection().insertOne(doc);
  return doc;
}

export async function applyDraftPatch(
  sessionId: string,
  patch: PatientDataPatch,
): Promise<SessionDoc | null> {
  const now = new Date();
  const setFields: Record<string, unknown> = { lastActivityAt: now };

  for (const [key, value] of Object.entries(patch)) {
    setFields[`data.${key}`] = value;
  }

  const result = await sessionsCollection().findOneAndUpdate(
    { _id: sessionId, submittedAt: null },
    {
      $set: setFields,
      $setOnInsert: {
        createdAt: now,
        status: 'filling',
        submittedAt: null,
      },
    },
    { returnDocument: 'after', upsert: true },
  );

  if (!result) return null;

  // ให้แน่ใจว่า field ที่ยังไม่เคยถูกเซ็ตมีค่าเริ่มต้นครบ
  result.data = { ...EMPTY_PATIENT_DATA, ...result.data };
  if (result.status !== 'submitted') {
    await sessionsCollection().updateOne(
      { _id: sessionId, submittedAt: null },
      { $set: { status: 'filling' } },
    );
    result.status = 'filling';
  }

  return result;
}

export async function touchSession(sessionId: string): Promise<void> {
  await sessionsCollection().updateOne(
    { _id: sessionId, submittedAt: null },
    { $set: { lastActivityAt: new Date(), status: 'filling' } },
  );
}

export async function markIdle(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  await sessionsCollection().updateMany(
    { _id: { $in: sessionIds }, submittedAt: null },
    { $set: { status: 'idle' } },
  );
}

export async function submitSession(
  sessionId: string,
  data: PatientData,
): Promise<SessionDoc> {
  const submittedAt = new Date();

  await submissionsCollection().insertOne({ sessionId, data, submittedAt });

  const result = await sessionsCollection().findOneAndUpdate(
    { _id: sessionId },
    {
      $set: {
        data,
        status: 'submitted',
        submittedAt,
        lastActivityAt: submittedAt,
      },
      $setOnInsert: { createdAt: submittedAt },
    },
    { returnDocument: 'after', upsert: true },
  );

  if (!result) throw new Error(`Failed to persist submission for session ${sessionId}`);
  return result;
}

export async function listSessions(limit = 100): Promise<SessionDoc[]> {
  const docs = await sessionsCollection()
    .find({}, { sort: { lastActivityAt: -1 }, limit })
    .toArray();

  return docs.map((doc) => ({
    ...doc,
    data: { ...EMPTY_PATIENT_DATA, ...doc.data },
  }));
}

export async function findStaleSessions(thresholdMs: number): Promise<SessionDoc[]> {
  const cutoff = new Date(Date.now() - thresholdMs);
  return sessionsCollection()
    .find({
      submittedAt: null,
      status: 'filling',
      lastActivityAt: { $lt: cutoff },
    })
    .toArray();
}
