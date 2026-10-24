import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { exportCsv } from "@/features/vocab/service";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/v1/decks/[id]/export">) => {
  const user = await requireApiUser();
  const { name, csv } = await exportCsv(user._id, (await ctx.params).id);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}.csv`,
    },
  });
});
