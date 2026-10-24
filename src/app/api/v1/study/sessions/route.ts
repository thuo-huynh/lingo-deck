import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { createSession } from "@/features/study/session";

export const POST = handler(async (req: Request) => {
  const user = await requireApiUser();
  const s = await createSession(user, await req.json());
  return { id: s._id.toHexString(), total: s.items.length };
});
