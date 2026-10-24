import { z } from "zod";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { collections } from "@/lib/db";

const input = z.object({
  displayName: z.string().trim().max(60).optional(),
  dailyGoal: z.number().int().min(1).max(200).optional(),
  dayStartHour: z.number().int().min(0).max(23).optional(),
  onboarded: z.boolean().optional(),
});

export const PATCH = handler(async (req: Request) => {
  const user = await requireApiUser();
  const $set = input.parse(await req.json());
  const { users } = await collections();
  await users.updateOne({ _id: user._id }, { $set });
});
