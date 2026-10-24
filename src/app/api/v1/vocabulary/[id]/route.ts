import { z } from "zod";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { resetVocabProgress, setVocabStatus, updateVocab } from "@/features/vocab/service";

type Ctx = RouteContext<"/api/v1/vocabulary/[id]">;

export const PUT = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await updateVocab(user._id, (await ctx.params).id, await req.json());
});

const action = z.object({ action: z.enum(["suspend", "unsuspend", "reset"]) });

export const POST = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  const id = (await ctx.params).id;
  const { action: a } = action.parse(await req.json());
  if (a === "reset") await resetVocabProgress(user._id, id);
  else await setVocabStatus(user._id, id, a === "suspend" ? "suspended" : "active");
});

/** Soft delete: review history is kept. */
export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireApiUser();
  await setVocabStatus(user._id, (await ctx.params).id, "archived");
});
