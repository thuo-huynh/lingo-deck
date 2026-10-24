import { readFileSync } from "node:fs";
import { test as base, expect } from "@playwright/test";
import { sealData } from "iron-session";
import { MongoClient, ObjectId } from "mongodb";

const PASSWORD = "e2e-session-password-at-least-32-chars!!";

/** Seeds a user and signs the browser in with a real sealed session cookie (OTP itself is covered by integration tests). */
export const test = base.extend<{ signIn: (opts?: { onboarded?: boolean }) => Promise<ObjectId>; db: MongoClient }>({
  db: async ({}, use) => {
    const client = await new MongoClient(readFileSync("e2e/.mongo-uri", "utf8")).connect();
    await use(client);
    await client.close();
  },
  signIn: async ({ context, db }, use) => {
    await use(async ({ onboarded = false } = {}) => {
      const _id = new ObjectId();
      await db.db("e2e").collection("users").insertOne({
        _id,
        email: `${_id.toHexString()}@lingo.test`,
        timezone: "Asia/Ho_Chi_Minh",
        dayStartHour: 4,
        dailyGoal: 10,
        onboarded,
        createdAt: new Date(),
      });
      const value = await sealData({ userId: _id.toHexString() }, { password: PASSWORD, ttl: 3600 });
      await context.addCookies([{ name: "ld_session", value, domain: "localhost", path: "/" }]);
      return _id;
    });
  },
});

export { expect };
