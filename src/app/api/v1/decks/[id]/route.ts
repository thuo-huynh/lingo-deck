import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { archiveDeck, moveDeck, updateDeck } from "@/features/decks/service";
import { z } from "zod";

type Ctx = RouteContext<"/api/v1/decks/[id]">;

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await updateDeck(user._id, (await ctx.params).id, await req.json());
});

/** Soft delete. `?moveTo=<deckId>` moves the words (with their history) instead of archiving them. */
export const DELETE = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await archiveDeck(user._id, (await ctx.params).id, new URL(req.url).searchParams.get("moveTo"));
});

const move = z.object({ direction: z.enum(["up", "down"]) });

/** Reorder among siblings. */
export const POST = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await moveDeck(user._id, (await ctx.params).id, move.parse(await req.json()).direction);
});
