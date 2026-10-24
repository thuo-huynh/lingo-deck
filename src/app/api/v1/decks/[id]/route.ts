import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { archiveDeck, updateDeck } from "@/features/decks/service";

type Ctx = RouteContext<"/api/v1/decks/[id]">;

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await updateDeck(user._id, (await ctx.params).id, await req.json());
});

/** Soft delete: the deck and subdecks are archived, words keep their review history. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await archiveDeck(user._id, (await ctx.params).id);
});
