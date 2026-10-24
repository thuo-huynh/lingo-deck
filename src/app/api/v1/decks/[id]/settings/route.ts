import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { updateDeckSettings } from "@/features/decks/service";

/** Body: full settings object, or null to inherit from the parent deck. */
export const PUT = handler(async (req: Request, ctx: RouteContext<"/api/v1/decks/[id]/settings">) => {
  const user = await requireApiUser();
  await updateDeckSettings(user._id, (await ctx.params).id, await req.json());
});
