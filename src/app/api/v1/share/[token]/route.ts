import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { copySharedDeck } from "@/features/share/service";

/** Adds a copy of the shared deck to the signed-in user's library. */
export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/v1/share/[token]">) => {
  const user = await requireApiUser();
  return copySharedDeck(user._id, (await ctx.params).token);
});
