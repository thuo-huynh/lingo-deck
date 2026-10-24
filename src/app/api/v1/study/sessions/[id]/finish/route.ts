import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { finishSession } from "@/features/study/session";

export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/v1/study/sessions/[id]/finish">) => {
  const user = await requireApiUser();
  return finishSession(user._id, (await ctx.params).id);
});
