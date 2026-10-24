import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

/** Wraps a route handler: maps domain and validation errors to JSON responses, never leaks internals. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const data = await fn(...args);
      return data instanceof Response ? data : NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        return NextResponse.json({ error: e.issues[0]?.message ?? "Dữ liệu không hợp lệ", issues: e.issues }, { status: 400 });
      }
      // Redirect/notFound from next/navigation must propagate.
      if (e && typeof e === "object" && "digest" in e) throw e;
      console.error(e);
      return NextResponse.json({ error: "Có lỗi xảy ra, thử lại sau" }, { status: 500 });
    }
  };
}
