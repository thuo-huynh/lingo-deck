import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { submitStep } from "@/features/study/session";

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/v1/study/sessions/[id]/steps">) => {
  const user = await requireApiUser();
  return submitStep(user, (await ctx.params).id, await req.json());
});
