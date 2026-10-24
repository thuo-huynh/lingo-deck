import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { collections } from "@/lib/db";
import { settingsSchema } from "@/features/decks/settings";

/** Preset "Mặc định". Changing it never rewrites existing schedules (spec 10.3). */
export const PUT = handler(async (req: Request) => {
  const user = await requireApiUser();
  const defaultSettings = settingsSchema.parse(await req.json());
  const { users } = await collections();
  await users.updateOne({ _id: user._id }, { $set: { defaultSettings } });
});
