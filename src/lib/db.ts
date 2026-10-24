import { attachDatabasePool } from "@vercel/functions";
import { MongoClient, type Db } from "mongodb";
import type { DeckDoc, OtpDoc, ReviewLogDoc, SessionDoc, UserDoc, VocabDoc } from "./types";

const globalForDb = globalThis as unknown as { mongo?: Promise<MongoClient>; mongoUri?: string };

export function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  // Reuse one client across hot reloads and serverless invocations.
  if (!globalForDb.mongo || globalForDb.mongoUri !== uri) {
    globalForDb.mongoUri = uri;
    const client = new MongoClient(uri, { ignoreUndefined: true });
    // Lets Vercel Functions close idle pool connections before an instance is suspended (no leaked Atlas connections).
    attachDatabasePool(client);
    globalForDb.mongo = client.connect().then(async (c) => {
      await ensureIndexes(c.db(process.env.MONGODB_DB ?? "lingodeck"));
      return c;
    });
  }
  return globalForDb.mongo;
}

export async function getDb() {
  return (await getClient()).db(process.env.MONGODB_DB ?? "lingodeck");
}

export async function collections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    otps: db.collection<OtpDoc>("otps"),
    decks: db.collection<DeckDoc>("decks"),
    vocab: db.collection<VocabDoc>("vocab"),
    sessions: db.collection<SessionDoc>("sessions"),
    reviewLogs: db.collection<ReviewLogDoc>("reviewLogs"),
  };
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("otps").createIndex({ email: 1 }),
    db.collection("otps").createIndex({ ip: 1 }),
    db.collection("decks").createIndex({ ownerId: 1, path: 1 }),
    db.collection("vocab").createIndex({ ownerId: 1, deckPath: 1, "srs.due": 1 }),
    db.collection("vocab").createIndex({ ownerId: 1, deckId: 1, createdAt: -1 }),
    db.collection("sessions").createIndex({ userId: 1, startedAt: -1 }),
    db.collection("reviewLogs").createIndex({ attemptKey: 1 }, { unique: true }),
    db.collection("reviewLogs").createIndex({ userId: 1, reviewedAt: -1 }),
  ]);
}
