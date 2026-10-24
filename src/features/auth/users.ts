import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import { isValidTimeZone } from "@/lib/day";
import type { UserDoc } from "@/lib/types";

/** One account per email, whichever way the person signs in (email code or Google). */
export async function findOrCreateUser(rawEmail: string, timezone = "Asia/Ho_Chi_Minh", now = new Date()) {
  const email = rawEmail.trim().toLowerCase();
  const { users } = await collections();
  const user = await users.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        email,
        timezone: isValidTimeZone(timezone) ? timezone : "Asia/Ho_Chi_Minh",
        dayStartHour: 4,
        dailyGoal: 10,
        onboarded: false,
        createdAt: now,
      } satisfies Omit<UserDoc, "displayName">,
    },
    { upsert: true, returnDocument: "after" }
  );
  return user!;
}
