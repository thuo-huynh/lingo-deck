import { z } from "zod";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { importCsv } from "@/features/vocab/service";

const input = z.object({ csv: z.string(), commit: z.boolean().default(false) });

/** commit=false: preview only. commit=true: validates again and inserts valid rows. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/v1/decks/[id]/import">) => {
  const user = await requireApiUser();
  const { csv, commit } = input.parse(await req.json());
  return importCsv(user._id, (await ctx.params).id, csv, commit);
});
