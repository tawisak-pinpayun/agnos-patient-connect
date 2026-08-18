import { MongoClient, type Db } from 'mongodb';
import { config } from '../config';
import type { SessionDoc, SubmissionDoc } from './types';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(config.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });

  await client.connect();
  db = client.db(config.mongoDb);
  await ensureIndexes(db);

  console.log(`[mongo] connected to database "${config.mongoDb}"`);
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('MongoDB is not connected yet. Call connectMongo() first.');
  return db;
}

export function sessionsCollection() {
  return getDb().collection<SessionDoc>('sessions');
}

export function submissionsCollection() {
  return getDb().collection<SubmissionDoc>('submissions');
}

export async function pingMongo(): Promise<boolean> {
  try {
    await getDb().command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}

async function ensureIndexes(database: Db): Promise<void> {
  const sessions = database.collection<SessionDoc>('sessions');
  const submissions = database.collection<SubmissionDoc>('submissions');

  await Promise.all([
    sessions.createIndex({ lastActivityAt: -1 }),
    sessions.createIndex({ status: 1, lastActivityAt: -1 }),
    // ลบ draft ที่ไม่ถูก submit อัตโนมัติ (partial TTL index)
    sessions.createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: config.draftTtlDays * 24 * 60 * 60,
        partialFilterExpression: { submittedAt: null },
        name: 'draft_ttl',
      },
    ),
    submissions.createIndex({ sessionId: 1 }),
    submissions.createIndex({ submittedAt: -1 }),
  ]);
}
