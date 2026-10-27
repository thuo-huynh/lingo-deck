import { z } from "zod";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { setSharing } from "@/features/share/service";

/** Body {enabled}: turns the deck's share link on or off. Returns the token, or null when off. */
export const PUT = handler(async (req: Request, ctx: RouteContext<"/api/v1/decks/[id]/share">) => {
  const user = await requireApiUser();
  const { enabled } = z.object({ enabled: z.boolean() }).parse(await req.json());
  return { token: await setSharing(user._id, (await ctx.params).id, enabled) };
});
