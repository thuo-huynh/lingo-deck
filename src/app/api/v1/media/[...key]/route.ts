import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { notFound } from "@/lib/errors";
import { presignDownload } from "@/lib/r2";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/v1/media/[...key]">) => {
  const user = await requireApiUser();
  const key = (await ctx.params).key.join("/");
  if (!key.startsWith(`${user._id.toHexString()}/`) || key.includes("..")) throw notFound();
  const res = NextResponse.redirect(await presignDownload(key));
  res.headers.set("Cache-Control", "private, max-age=3000");
  return res;
});
