import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { getDb } from "@/lib/db";

/** Real MongoDB replica set in memory (transactions need a replica set), wiped between tests. */
export function setupTestMongo() {
  let rs: MongoMemoryReplSet;
  beforeAll(async () => {
    rs = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    process.env.MONGODB_URI = rs.getUri();
    process.env.MONGODB_DB = "test";
  });
  beforeEach(async () => {
    const db = await getDb();
    for (const c of await db.collections()) await c.deleteMany({});
  });
  afterAll(async () => {
    const { getClient } = await import("@/lib/db");
    await (await getClient()).close();
    await rs.stop();
  });
}
