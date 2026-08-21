import type { AuditEntry, PatientData, SessionStatus } from '@apc/shared';

export interface SessionDoc {
  _id: string;
  data: PatientData;
  status: Exclude<SessionStatus, 'idle'> | 'idle';
  createdAt: Date;
  lastActivityAt: Date;
  submittedAt: Date | null;
  audit: AuditEntry[];
}

export interface SubmissionDoc {
  _id?: unknown;
  sessionId: string;
  data: PatientData;
  submittedAt: Date;
}
