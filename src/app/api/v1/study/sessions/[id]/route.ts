import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { getOwnedSession } from "@/features/study/session";
import { sessionView } from "@/features/study/view";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/v1/study/sessions/[id]">) => {
  const user = await requireApiUser();
  return sessionView(await getOwnedSession(user._id, (await ctx.params).id), user._id);
});
