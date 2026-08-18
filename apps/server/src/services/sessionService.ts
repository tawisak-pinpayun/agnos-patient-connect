import {
  buildDisplayName,
  countFilledFields,
  patientSchema,
  patientDraftSchema,
  REQUIRED_PATIENT_FIELDS,
  sessionIdSchema,
  type FieldError,
  type PatientData,
  type PatientDataPatch,
  type SessionSnapshot,
  type SessionStatus,
  type SessionSummary,
} from '@apc/shared';
import { config } from '../config';
import * as repo from '../db/sessionRepository';
import type { SessionDoc } from '../db/types';
import { isPatientConnected } from './presence';

export function isValidSessionId(sessionId: unknown): sessionId is string {
  return sessionIdSchema.safeParse(sessionId).success;
}

function resolveStatus(doc: SessionDoc): SessionStatus {
  if (doc.submittedAt) return 'submitted';
  const isFresh = Date.now() - doc.lastActivityAt.getTime() < config.idleThresholdMs;
  if (isPatientConnected(doc._id) && isFresh) return 'filling';
  return 'idle';
}

export function toSummary(doc: SessionDoc): SessionSummary {
  return {
    sessionId: doc._id,
    status: resolveStatus(doc),
    displayName: buildDisplayName(doc.data),
    filledCount: countFilledFields(doc.data),
    totalCount: REQUIRED_PATIENT_FIELDS.length,
    createdAt: doc.createdAt.toISOString(),
    lastActivityAt: doc.lastActivityAt.toISOString(),
    submittedAt: doc.submittedAt ? doc.submittedAt.toISOString() : null,
    connected: isPatientConnected(doc._id),
  };
}

export function toSnapshot(doc: SessionDoc): SessionSnapshot {
  return { ...toSummary(doc), data: doc.data };
}

export async function joinSession(sessionId: string): Promise<SessionSnapshot> {
  const doc = await repo.ensureSession(sessionId);
  return toSnapshot(doc);
}

export async function getSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
  const doc = await repo.findSession(sessionId);
  return doc ? toSnapshot(doc) : null;
}

export async function listSummaries(): Promise<SessionSummary[]> {
  const docs = await repo.listSessions();
  return docs.map(toSummary);
}

export interface DraftUpdateResult {
  patch: PatientDataPatch;
  summary: SessionSummary;
  lastActivityAt: string;
}

export async function updateDraft(
  sessionId: string,
  rawPatch: unknown,
): Promise<DraftUpdateResult> {
  const parsed = patientDraftSchema.safeParse(rawPatch);
  if (!parsed.success) throw new Error('INVALID_PATCH');

  const patch = parsed.data as PatientDataPatch;
  if (Object.keys(patch).length === 0) throw new Error('EMPTY_PATCH');

  const doc = await repo.applyDraftPatch(sessionId, patch);
  if (!doc) throw new Error('SESSION_LOCKED');

  return {
    patch,
    summary: toSummary(doc),
    lastActivityAt: doc.lastActivityAt.toISOString(),
  };
}

export interface SubmitResult {
  data: PatientData;
  summary: SessionSummary;
  submittedAt: string;
}

export function validatePatientData(
  raw: unknown,
): { ok: true; data: PatientData } | { ok: false; errors: FieldError[] } {
  const parsed = patientSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data as PatientData };

  const errors: FieldError[] = parsed.error.issues.map((issue) => ({
    field: String(issue.path[0] ?? '_form'),
    message: issue.message,
  }));
  return { ok: false, errors };
}

export async function submitDraft(
  sessionId: string,
  data: PatientData,
): Promise<SubmitResult> {
  const doc = await repo.submitSession(sessionId, data);
  return {
    data: doc.data,
    summary: toSummary(doc),
    submittedAt: (doc.submittedAt ?? new Date()).toISOString(),
  };
}

export async function collectIdleSessions(): Promise<SessionSummary[]> {
  const stale = await repo.findStaleSessions(config.idleThresholdMs);
  const idle = stale.filter((doc) => !isPatientConnected(doc._id));
  await repo.markIdle(idle.map((doc) => doc._id));
  return idle.map((doc) => ({ ...toSummary(doc), status: 'idle' as SessionStatus }));
}

export async function refreshSummary(sessionId: string): Promise<SessionSummary | null> {
  const doc = await repo.findSession(sessionId);
  return doc ? toSummary(doc) : null;
}

export async function touch(sessionId: string): Promise<void> {
  await repo.touchSession(sessionId);
}
