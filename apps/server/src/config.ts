import 'dotenv/config';
import { IDLE_THRESHOLD_MS } from '@apc/shared';

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000'];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? '',
  mongoDb: process.env.MONGODB_DB ?? 'patient-connect',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  idleThresholdMs: Number(process.env.IDLE_THRESHOLD_MS ?? IDLE_THRESHOLD_MS),
  draftTtlDays: Number(process.env.DRAFT_TTL_DAYS ?? 7),
};

if (!config.mongoUri) {
  throw new Error(
    'MONGODB_URI is required. Copy apps/server/.env.example to apps/server/.env and fill it in.',
  );
}
